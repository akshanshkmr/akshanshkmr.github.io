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

          @page { size: A4; margin: 14mm 14mm; }

          /* Print theme — light, ATS-friendly */
          .resume {
               --rs-text:           #1a1a1a;
               --rs-dim:               #555555;
               --rs-very-dim: #c0c0c0;
               --rs-accent:      #1a1a1a;
               --rs-link:           #2563eb;
               background: white !important;
               border: none !important;
               padding: 0 !important;
               max-width: none !important;
               font-size: 10.5px;
               line-height: 1.45;
               color: #1a1a1a !important;
          }
          .resume .r-head h1 { font-size: 20px; }
          .resume .r-section h2 { font-size: 10.5px; border-color: #1a1a1a; }
          .resume .r-section { margin-top: 10px; }
          .resume .r-job, .resume .r-edu { margin-top: 7px; }
          .resume .r-projects { gap: 4px; }

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

     function triggerPrint() {
          try {
               iframe.contentWindow.focus();
               iframe.contentWindow.print();
          } catch (err) {
               console.error('resume pdf: print failed', err);
          }
          setTimeout(() => iframe.remove(), 60_000);
     }

     iframe.addEventListener('load', () => {
          const fonts = iframe.contentDocument.fonts;
          if (fonts && fonts.ready) fonts.ready.then(triggerPrint);
          else setTimeout(triggerPrint, 500);
     });
}

export default {
     name: 'resume',
     description: 'view full resume — try /resume --pdf',
     run: async (args, { renderBlock, scroll, resume }) => {
          const parsed = resume;

          if (args.includes('--pdf') || args.includes('--print')) {
               renderBlock(scroll, {
                    type: 'tool',
                    header: 'resume',
                    meta: 'pdf',
                    bodyText: 'opening print dialog…',
               });
               await pdf(parsed);
               return;
          }

          const html = renderResumeTerminal(parsed);
          renderBlock(scroll, {
               type: 'tool',
               header: 'resume',
               bodyHTML: `${html}<div style="margin-top:12px;color:var(--dim);font-size:12px">try <span style="color:var(--accent)">/resume --pdf</span> to download an ATS-friendly PDF</div>`,
          });
     },
};

