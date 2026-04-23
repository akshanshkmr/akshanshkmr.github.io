const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
const DURATION_MS = 5000;
const FONT_SIZE = 14;

export default {
     name: 'matrix',
     description: 'wake up, neo',
     run: () => new Promise((resolve) => {
          const frame = document.body;
          const overlay = document.createElement('div');
          overlay.className = 'matrix-overlay';
          const canvas = document.createElement('canvas');
          canvas.className = 'matrix-canvas';
          overlay.appendChild(canvas);
          frame.appendChild(overlay);

          const ctx = canvas.getContext('2d');
          const resize = () => {
               canvas.width = overlay.clientWidth;
               canvas.height = overlay.clientHeight;
          };
          resize();
          const cols = Math.floor(canvas.width / FONT_SIZE);
          const drops = new Array(cols).fill(0).map(() => Math.random() * -50);
          const start = performance.now();

          function tick(now) {
               ctx.fillStyle = 'rgba(22, 22, 30, 0.08)';
               ctx.fillRect(0, 0, canvas.width, canvas.height);
               ctx.fillStyle = '#9ece6a';
               ctx.font = `${FONT_SIZE}px monospace`;
               for (let i = 0; i < cols; i++) {
                    const ch = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
                    ctx.fillText(ch, i * FONT_SIZE, drops[i] * FONT_SIZE);
                    drops[i]++;
                    if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
                         drops[i] = 0;
                    }
               }
               if (now - start < DURATION_MS) {
                    requestAnimationFrame(tick);
               } else {
                    overlay.remove();
                    resolve();
               }
          }
          requestAnimationFrame(tick);
     }),
};

