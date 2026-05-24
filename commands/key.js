async function testApiKey(key) {
     const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
               'Content-Type': 'application/json'
          },
          body: JSON.stringify({
               contents: [
                    {
                         role: 'user',
                         parts: [{ text: 'x' }]
                    }
               ],
               generationConfig: {
                    maxOutputTokens: 1
               }
          })
     });
     
     if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error?.message || `HTTP ${res.status}`;
          throw new Error(errMsg);
     }
}

export default {
     name: 'key',
     description: 'configure Gemini API key for AI chat (interactive)',
     run: (args, { renderBlock, scroll, showToast }) => new Promise((resolve) => {
          const input = document.getElementById("prompt-input");
          const hasKey = !!localStorage.getItem('gemini_api_key');

          // Non-interactive direct argument CLI call (e.g. `/key AIza...` or `/key --clear`)
          if (args.length > 0) {
               if (args[0] === '--clear') {
                    localStorage.removeItem('gemini_api_key');
                    showToast('✓ API key cleared');
                    renderBlock(scroll, {
                         type: 'tool',
                         header: 'key',
                         meta: 'cleared',
                         bodyText: 'Gemini API key successfully removed from browser storage.',
                    });
                    resolve();
                    return;
               }
               
               const targetKey = args[0].trim();
               const block = renderBlock(scroll, {
                    type: 'tool',
                    header: 'key',
                    meta: 'testing',
                    bodyText: 'testing API key validity…',
               });
               const bodyCol = block.querySelector(".body-col");

               testApiKey(targetKey).then(() => {
                    localStorage.setItem('gemini_api_key', targetKey);
                    showToast('✓ API key saved');
                    bodyCol.innerHTML = `<span style="color:var(--ok)">✓ Gemini API key is valid and configured successfully!</span>\n\n` +
                                        `You can now chat with Akshansh's AI Persona by typing any question directly into the prompt.`;
                    resolve();
               }).catch((err) => {
                    bodyCol.innerHTML = `<span style="color:var(--red)">error: Gemini API key validation failed!</span>\n\n` +
                                        `Reason: <span style="color:var(--red)">${err.message}</span>\n\n` +
                                        `Please get a valid key from Google AI Studio and try again.`;
                    resolve();
               });
               return;
          }

          // Interactive Mode Setup
          input.blur();
          input.readOnly = true;

          const options = hasKey 
               ? ['Paste / Enter new API Key', 'Clear existing API Key', 'Cancel']
               : ['Paste / Enter API Key', 'Cancel'];

          let selectedIdx = 0;

          const block = renderBlock(scroll, {
               type: 'tool',
               header: 'key',
               meta: 'interactive',
               bodyHTML: '',
          });
          const bodyCol = block.querySelector(".body-col");

          function paintMenu() {
               const status = hasKey 
                    ? '<span style="color:var(--ok)">configured</span> (stored safely in your browser)' 
                    : '<span style="color:var(--red)">not configured</span>';

               const menuText = options.map((opt, idx) => {
                    if (idx === selectedIdx) {
                         return `<span style="color:var(--accent);font-weight:bold">▶ ${opt}</span>`;
                    }
                    return `  <span style="color:var(--dim)">${opt}</span>`;
               }).join('\n');

               bodyCol.innerHTML = `Current Status: ${status}\n\n` +
                                   `Get a free key from Google AI Studio: <a href="https://aistudio.google.com/" target="_blank" style="color:var(--cyan);text-decoration:underline;">aistudio.google.com</a>\n\n` +
                                   `${menuText}\n\n` +
                                   `<span style="color:var(--dim)">[Use ↑/↓ to navigate, Enter to select, Esc to cancel]</span>`;
               
               scroll.scrollTop = scroll.scrollHeight;
          }

          function cleanup() {
               window.removeEventListener('keydown', onKeyMenu, true);
               input.readOnly = false;
               input.focus();
               resolve();
          }

          function onKeyMenu(e) {
               if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === 'ArrowUp') {
                         selectedIdx = (selectedIdx - 1 + options.length) % options.length;
                    } else {
                         selectedIdx = (selectedIdx + 1) % options.length;
                    }
                    paintMenu();
               } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();

                    const choice = options[selectedIdx];
                    if (choice.startsWith('Paste / Enter')) {
                         window.removeEventListener('keydown', onKeyMenu, true);
                         setTimeout(() => {
                              promptForKeyEntry();
                         }, 50);
                    } else if (choice.startsWith('Clear existing')) {
                         localStorage.removeItem('gemini_api_key');
                         showToast('✓ API key cleared');
                         bodyCol.innerHTML = `<span style="color:var(--dim)">API key cleared successfully.</span>`;
                         cleanup();
                    } else {
                         bodyCol.innerHTML = `<span style="color:var(--dim)">Interactive key setup cancelled.</span>`;
                         cleanup();
                    }
               } else if (e.key === 'Escape' || (e.key === 'c' && e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    bodyCol.innerHTML = `<span style="color:var(--dim)">Interactive key setup cancelled.</span>`;
                    cleanup();
               }
          }

          function promptForKeyEntry() {
               // Setup input field for key entry
               input.readOnly = false;
               input.value = '';
               input.placeholder = 'Paste your Gemini API Key here and press Enter (Esc to cancel)...';
               input.type = 'text'; // Use standard text to avoid password manager hijacking
               input.focus();
               input.select();

               function onKeyInput(e) {
                    if (e.key === 'Enter') {
                         e.preventDefault();
                         e.stopPropagation();
                         
                         const pastedKey = input.value.trim();
                         input.value = '';
                         input.placeholder = 'Try /resume, /theme, /key, /snake';
                         input.type = 'text';
                         
                         window.removeEventListener('keydown', onKeyInput, true);
                         input.focus();

                         if (pastedKey) {
                              bodyCol.innerHTML = `<span style="color:var(--cyan)">testing API key validity…</span>`;
                              
                              testApiKey(pastedKey).then(() => {
                                   localStorage.setItem('gemini_api_key', pastedKey);
                                   showToast('✓ API key saved');
                                   
                                   const masked = pastedKey.length > 10 
                                        ? pastedKey.slice(0, 6) + '...' + pastedKey.slice(-4) 
                                        : '••••';
                                        
                                   bodyCol.innerHTML = `<span style="color:var(--ok)">✓ Gemini API key is valid and configured successfully! (saved as ${masked})</span>\n\n` +
                                                       `You can now chat with Akshansh's AI Persona by typing any question directly into the prompt.`;
                                   resolve();
                              }).catch((err) => {
                                   bodyCol.innerHTML = `<span style="color:var(--red)">error: Gemini API key validation failed!</span>\n\n` +
                                                       `Reason: <span style="color:var(--red)">${err.message}</span>\n\n` +
                                                       `Your key was NOT saved. Please enter a valid key from Google AI Studio.`;
                                   resolve();
                              });
                         } else {
                              bodyCol.innerHTML = `<span style="color:var(--dim)">No key entered. Setup cancelled.</span>`;
                              resolve();
                         }
                    } else if (e.key === 'Escape') {
                         e.preventDefault();
                         e.stopPropagation();
                         
                         input.value = '';
                         input.placeholder = 'Try /resume, /theme, /key, /snake';
                         input.type = 'text';
                         
                         window.removeEventListener('keydown', onKeyInput, true);
                         input.focus();
                         
                         bodyCol.innerHTML = `<span style="color:var(--dim)">Interactive key setup cancelled.</span>`;
                         resolve();
                    }
               }

               window.addEventListener('keydown', onKeyInput, true);
          }

          window.addEventListener('keydown', onKeyMenu, true);
          paintMenu();
     })
};
