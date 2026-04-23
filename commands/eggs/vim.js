const SCREEN_LINES = [
     '~',
     '~',
     '~',
     '~',
     '~     you opened vim. classic mistake.',
     '~',
     '~     press : to enter command mode, then :q! and Enter to escape',
     '~',
     '~',
];

const QUIT_COMMANDS = new Set(['q', 'q!', 'wq', 'wq!', 'x', 'qa', 'qa!']);

function escapeHtml(s) {
     return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default {
     name: 'vim',
     description: 'enter at your own risk',
     run: (_args, _ctx) => new Promise((resolve) => {
          const input = document.getElementById('prompt-input');
          input.blur();

          const modal = document.createElement('div');
          modal.className = 'vim-modal';
          modal.innerHTML = `
               <div class="vim-screen">${SCREEN_LINES.map(
                    (l) => `<div><span class="vim-tilde">~</span>${l.slice(1)}</div>`,
               ).join('')}</div>
               <div class="vim-status">
                    <span class="vim-status-mode">NORMAL</span>
                    <span class="vim-status-file">"akshansh" 1L, 0C</span>
               </div>
               <div class="vim-cmd"></div>
          `;
          document.body.appendChild(modal);

          const screenEl = modal.querySelector('.vim-screen');
          const modeEl = modal.querySelector('.vim-status-mode');
          const fileEl = modal.querySelector('.vim-status-file');
          const cmdEl = modal.querySelector('.vim-cmd');

          let mode = 'NORMAL';
          let buffer = '';
          let normalKeyHits = 0;
          let cmdAttempts = 0;

          function paint() {
               modeEl.textContent = mode;
               modeEl.dataset.mode = mode;
               if (mode === 'COMMAND') {
                    cmdEl.innerHTML =
                         `<span class="vim-prompt">:</span>` +
                         `<span class="vim-buf">${escapeHtml(buffer)}</span>` +
                         `<span class="vim-cursor">█</span>`;
               } else {
                    // NORMAL: no command line; subtle cursor sits at the top of the buffer
                    cmdEl.innerHTML = '';
               }
          }

          function close() {
               modal.remove();
               window.removeEventListener('keydown', onKey, true);
               input.focus();
               resolve();
          }

          function execute() {
               if (QUIT_COMMANDS.has(buffer)) {
                    modeEl.textContent = 'EXIT';
                    modeEl.dataset.mode = 'EXIT';
                    fileEl.textContent = 'transcended';
                    cmdEl.innerHTML = '';
                    setTimeout(close, 600);
                    return;
               }
               cmdAttempts++;
               if (cmdAttempts >= 3) {
                    modeEl.textContent = 'EXIT';
                    modeEl.dataset.mode = 'EXIT';
                    fileEl.textContent = 'you and me both — :q!';
                    cmdEl.innerHTML = '';
                    setTimeout(close, 1400);
                    return;
               }
               fileEl.textContent = `E492: Not an editor command: ${buffer} (${cmdAttempts}/3)`;
               buffer = '';
               mode = 'NORMAL';
               paint();
          }

          function onKey(e) {
               e.preventDefault();
               e.stopPropagation();

               if (mode === 'NORMAL') {
                    if (e.key === ':') {
                         mode = 'COMMAND';
                         buffer = '';
                         fileEl.textContent = '"akshansh" 1L, 0C';
                         paint();
                         return;
                    }
                    // Any other key is a wrong move; nudge after a few attempts
                    normalKeyHits++;
                    if (normalKeyHits === 3) {
                         fileEl.textContent = 'hint: press : to enter command mode';
                    } else if (normalKeyHits === 6) {
                         fileEl.textContent = 'really: press the colon key, then type q! and Enter';
                    }
                    return;
               }

               // COMMAND mode
               if (e.key === 'Enter') {
                    execute();
                    return;
               }
               if (e.key === 'Escape') {
                    mode = 'NORMAL';
                    buffer = '';
                    fileEl.textContent = '"akshansh" 1L, 0C';
                    paint();
                    return;
               }
               if (e.key === 'Backspace') {
                    if (buffer === '') {
                         mode = 'NORMAL';
                         fileEl.textContent = '"akshansh" 1L, 0C';
                         paint();
                    } else {
                         buffer = buffer.slice(0, -1);
                         paint();
                    }
                    return;
               }
               if (e.key.length === 1) {
                    buffer += e.key;
                    paint();
               }
          }

          window.addEventListener('keydown', onKey, true);
          paint();
     }),
};

