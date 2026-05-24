import { renderResume, renderResumeTerminal } from '../shell/resume-parser.js';

let cachedCss = null;

async function loadResumeCss() {
     if (cachedCss != null) return cachedCss;
     try {
          const res = await fetch('./resume-print.css', { cache: 'no-store' });
          cachedCss = res.ok ? await res.text() : '';
     } catch {
          cachedCss = '';
     }
     return cachedCss;
}

async function pdf(parsed) {
     const html = renderResume(parsed);
     const baseCss = await loadResumeCss();
     const fontHref =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

     const iframe = document.createElement('iframe');
     iframe.setAttribute('aria-hidden', 'true');
     iframe.style.cssText =
          'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:0;';
     document.body.appendChild(iframe);

     return new Promise((resolve) => {
          let triggered = false;
          let timeoutId = null;

          function triggerPrint() {
               if (triggered) return;
               triggered = true;
               if (timeoutId) clearTimeout(timeoutId);
               try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
               } catch (err) {
                    console.error('resume pdf: print failed', err);
               }
               setTimeout(() => {
                    iframe.remove();
                    resolve();
               }, 60_000);
          }

          iframe.addEventListener('load', () => {
               const fonts = iframe.contentDocument.fonts;
               if (fonts && fonts.ready) fonts.ready.then(triggerPrint);
               else setTimeout(triggerPrint, 500);
          });

          // Fallback timeout in case browser load event is bypassed
          timeoutId = setTimeout(triggerPrint, 1500);

          try {
               const doc = iframe.contentDocument || iframe.contentWindow.document;
               doc.open();
               doc.write(`<!DOCTYPE html>
<html>
<head>
     <meta charset="UTF-8">
     <title>Akshansh Kumar — Resume</title>
     <link rel="stylesheet" href="${fontHref}">
     <style>${baseCss}</style>
     <style>
          *, *::before, *::after {
               -webkit-print-color-adjust: exact !important;
               print-color-adjust: exact !important;
          }

           html, body { margin: 0; background: white; }
           body { font-family: 'Inter', -apple-system, system-ui, sans-serif; }

           @page { size: A4; margin: 0; }

           /* Print overrides for iframe context */
           .resume {
                border: none !important;
                max-width: none !important;
           }

          /* Page breaks: keep individual jobs/projects/edu entries together,
                   but allow sections themselves to split between items. */
          .resume .r-proj,
          .resume .r-edu,
          .resume .r-ach li,
          .resume .r-head { break-inside: avoid; page-break-inside: avoid; }
          .resume h2, .resume h3, .resume h4 { break-after: avoid; page-break-after: avoid; }
     </style>
</head>
<body>
     <div class="resume">${html}</div>
</body>
</html>`);
               doc.close();
          } catch (err) {
               console.error('Error writing to iframe', err);
               triggerPrint();
          }
     });
}

const OPTIONS = [
     'View inline in Terminal (TUI)',
     'Download / Print ATS-Friendly PDF'
];

export default {
     name: 'resume',
     description: 'view or download resume interactively',
     run: (args, { renderBlock, scroll, resume }) => new Promise((resolve) => {
          const parsed = resume;
          const input = document.getElementById("prompt-input");

          // Direct bypass flags
          if (args.includes('--pdf') || args.includes('--print')) {
               renderBlock(scroll, {
                    type: 'tool',
                    header: 'resume',
                    meta: 'pdf',
                    bodyText: 'opening print dialog…',
               });
               pdf(parsed).then(resolve);
               return;
          }

          // Interactive mode
          input.blur();
          input.readOnly = true;

          let selectedIdx = 0;

          const block = renderBlock(scroll, {
               type: 'tool',
               header: 'resume',
               meta: 'interactive',
               bodyHTML: '',
          });
          const bodyCol = block.querySelector(".body-col");

          function paint() {
               const menuText = OPTIONS.map((opt, idx) => {
                    if (idx === selectedIdx) {
                         return `<span style="color:var(--accent);font-weight:bold">▶ ${opt}</span>`;
                    }
                    return `  <span style="color:var(--dim)">${opt}</span>`;
               }).join('\n');
               bodyCol.innerHTML = `How would you like to view the resume?\n\n${menuText}\n\n<span style="color:var(--dim)">[Use ↑/↓ to navigate, Enter to select, Esc to cancel]</span>`;
               
               scroll.scrollTop = scroll.scrollHeight;
          }

          function cleanup() {
               window.removeEventListener('keydown', onKey, true);
               input.readOnly = false;
               setTimeout(() => {
                    input.focus();
               }, 50);
               resolve();
          }

          async function onKey(e) {
               if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedIdx = (selectedIdx + 1) % OPTIONS.length;
                    paint();
               } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (selectedIdx === 0) {
                         const html = renderResumeTerminal(parsed);
                         bodyCol.innerHTML = `${html}<div style="margin-top:12px;color:var(--dim);font-size:12px">try <span style="color:var(--accent)">/resume --pdf</span> to download an ATS-friendly PDF directly</div>`;
                         cleanup();
                    } else {
                         bodyCol.innerHTML = `opening print dialog…`;
                         cleanup();
                         await pdf(parsed);
                    }
               } else if (e.key === 'Escape' || (e.key === 'c' && e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    bodyCol.innerHTML = `<span style="color:var(--dim)">selection cancelled. Type /resume to try again.</span>`;
                    cleanup();
               }
          }

          window.addEventListener('keydown', onKey, true);
          paint();
     }),
};
