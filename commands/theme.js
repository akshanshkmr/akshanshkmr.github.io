const THEMES = ['dark', 'oled', 'tokyo', 'dracula', 'nord', 'gruvbox', 'catppuccin', 'rose-pine', 'matrix', 'solarized', 'light'];

export default {
     name: 'theme',
     description: 'select terminal color theme (e.g. /theme dracula)',
     run: (args, { renderBlock, scroll, showToast, clearScroll, renderInitial }) => new Promise((resolve) => {
          const input = document.getElementById("prompt-input");
          const originalTheme = localStorage.getItem('theme') || 'dark';
          
          let selectedIdx = THEMES.indexOf(originalTheme);
          if (selectedIdx === -1) selectedIdx = 0;

          // Direct execution if argument is passed, e.g., `/theme dracula`
          if (args.length > 0) {
               const target = args[0].toLowerCase();
               if (THEMES.includes(target)) {
                    THEMES.forEach((t) => document.body.classList.remove(`theme-${t}`));
                    document.body.classList.add(`theme-${target}`);
                    localStorage.setItem('theme', target);
                    clearScroll(scroll);
                    renderInitial(scroll);
                    showToast(`✓ theme set to ${target}`);
                    renderBlock(scroll, {
                         type: 'tool',
                         header: 'theme',
                         meta: 'set',
                         bodyHTML: `applied theme <strong style="color:var(--accent)">${target}</strong>`,
                    });
               } else {
                    renderBlock(scroll, {
                         type: 'error',
                         header: 'theme not found',
                         meta: target,
                         bodyText: `unknown theme. Available: ${THEMES.join(', ')}`,
                    });
               }
               resolve();
               return;
          }

          // Interactive mode
          input.blur();
          input.readOnly = true;

          const block = renderBlock(scroll, {
               type: 'tool',
               header: 'theme',
               meta: 'interactive',
               bodyHTML: '',
          });
          const bodyCol = block.querySelector(".body-col");

          function applyTheme(themeName) {
               THEMES.forEach((t) => document.body.classList.remove(`theme-${t}`));
               document.body.classList.add(`theme-${themeName}`);
          }

          function paint() {
               const menuText = THEMES.map((t, idx) => {
                    if (idx === selectedIdx) {
                         return `<span class="theme-menu-item active" data-idx="${idx}" style="color:var(--accent);font-weight:bold;cursor:pointer;display:block;padding:4px 0;">▶ ${t}</span>`;
                    }
                    return `<span class="theme-menu-item" data-idx="${idx}" style="color:var(--dim);cursor:pointer;display:block;padding:4px 0;">  ${t}</span>`;
               }).join('\n');
               bodyCol.innerHTML = `Select terminal theme:\n\n<div class="theme-menu-wrap">${menuText}</div>\n\n<span style="color:var(--dim)">[Use ↑/↓ to navigate, Enter to select, Esc to cancel]</span>`;
               
               // Keep scrolling aligned as selection updates
               scroll.scrollTop = scroll.scrollHeight;
          }

          function onMenuClick(e) {
               const item = e.target.closest('.theme-menu-item');
               if (!item) return;
               e.preventDefault();
               e.stopPropagation();
               const idx = parseInt(item.dataset.idx, 10);
               selectedIdx = idx;

               const finalTheme = THEMES[selectedIdx];
               applyTheme(finalTheme);
               localStorage.setItem('theme', finalTheme);
               clearScroll(scroll);
               renderInitial(scroll);
               showToast(`✓ theme set to ${finalTheme}`);

               bodyCol.innerHTML = `applied theme <strong style="color:var(--accent)">${finalTheme}</strong>`;
               cleanup();
          }

          function cleanup() {
               window.removeEventListener('keydown', onKey, true);
               bodyCol.removeEventListener('click', onMenuClick);
               input.readOnly = false;
               setTimeout(() => {
                    input.focus();
               }, 50);
               resolve();
          }

          function onKey(e) {
               if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedIdx = (selectedIdx - 1 + THEMES.length) % THEMES.length;
                    applyTheme(THEMES[selectedIdx]);
                    paint();
               } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedIdx = (selectedIdx + 1) % THEMES.length;
                    applyTheme(THEMES[selectedIdx]);
                    paint();
               } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    const finalTheme = THEMES[selectedIdx];
                    applyTheme(finalTheme);
                    localStorage.setItem('theme', finalTheme);
                    clearScroll(scroll);
                    renderInitial(scroll);
                    showToast(`✓ theme set to ${finalTheme}`);
                    
                    bodyCol.innerHTML = `applied theme <strong style="color:var(--accent)">${finalTheme}</strong>`;
                    cleanup();
               } else if (e.key === 'Escape' || (e.key === 'c' && e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    applyTheme(originalTheme); // Revert
                    
                    bodyCol.innerHTML = `<span style="color:var(--dim)">cancelled (reverted to ${originalTheme})</span>`;
                    cleanup();
               }
          }

          bodyCol.addEventListener('click', onMenuClick);
          window.addEventListener('keydown', onKey, true);
          paint();
     }),
};
