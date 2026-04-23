const W = 34;
const H = 20;
const INITIAL_SPEED_MS = 140;
const SPEED_BUMP_AT = 5;

// Each grid cell is rendered as 2 characters wide so cells look square
// (monospace cells are ~1.67× taller than wide).
const CELL_SNAKE = '<span class="s">██</span>';
const CELL_APPLE = '<span class="a">◉ </span>';
const CELL_EMPTY = '<span class="e">· </span>';

export function newGame() {
     const mid = Math.floor(H / 2);
     const snake = [
          { x: 5, y: mid },
          { x: 6, y: mid },
          { x: 7, y: mid },
     ];
     return {
          width: W,
          height: H,
          snake,
          dir: { x: 1, y: 0 },
          pendingDir: null,
          apple: spawnApple(snake),
          alive: true,
          score: 0,
     };
}

function spawnApple(snake) {
     let a;
     do {
          a = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
     } while (snake.some((s) => s.x === a.x && s.y === a.y));
     return a;
}

function isOpposite(a, b) {
     return a.x === -b.x && a.y === -b.y;
}

export function tick(g) {
     if (!g.alive) return g;
     let dir = g.dir;
     if (g.pendingDir && !isOpposite(g.pendingDir, g.dir)) {
          dir = g.pendingDir;
     }
     const head = g.snake[g.snake.length - 1];
     const next = { x: head.x + dir.x, y: head.y + dir.y };

     if (next.x < 0 || next.x >= W || next.y < 0 || next.y >= H) {
          return { ...g, alive: false, dir };
     }

     const body = g.snake.slice(0, -1);
     if (body.some((s) => s.x === next.x && s.y === next.y)) {
          return { ...g, alive: false, dir };
     }

     const eating = next.x === g.apple.x && next.y === g.apple.y;
     const newSnake = [...g.snake, next];
     if (!eating) newSnake.shift();

     return {
          ...g,
          snake: newSnake,
          apple: eating ? spawnApple(newSnake) : g.apple,
          score: eating ? g.score + 1 : g.score,
          dir,
          pendingDir: null,
     };
}

function render(g) {
     const grid = [];
     for (let y = 0; y < H; y++) {
          let row = '';
          for (let x = 0; x < W; x++) {
               if (g.snake.some((s) => s.x === x && s.y === y)) row += CELL_SNAKE;
               else if (g.apple.x === x && g.apple.y === y) row += CELL_APPLE;
               else row += CELL_EMPTY;
          }
          grid.push(row);
     }
     return grid.join('\n');
}

const KEY_DIRS = {
     ArrowUp: { x: 0, y: -1 },
     ArrowDown: { x: 0, y: 1 },
     ArrowLeft: { x: -1, y: 0 },
     ArrowRight: { x: 1, y: 0 },
};

export default {
     name: 'snake',
     description: 'play snake — arrows to move, q to quit',
     run: (_args, { scroll }) => new Promise((resolve) => {
          const input = document.getElementById('prompt-input');
          input.blur();

          const wrap = document.createElement('div');
          wrap.className = 'tool tool--tool';
          wrap.innerHTML = `
               <div class="tool-head">
                    <span class="dot">⏺ </span><span class="name">snake</span><span class="meta"></span>
               </div>
               <div class="tool-body">
                    <span class="branch-col">     ⎿     </span>
                    <div class="body-col"><pre class="snake-grid-inline"></pre></div>
               </div>
          `;
          scroll.appendChild(wrap);

          const gridEl = wrap.querySelector('.snake-grid-inline');
          const metaEl = wrap.querySelector('.meta');

          let game = newGame();
          let paused = false;
          let speed = INITIAL_SPEED_MS;
          let timer;

          function paint() {
               gridEl.innerHTML = render(game);
               metaEl.textContent = paused
                    ? `(score ${game.score} · paused — p to resume)`
                    : `(score ${game.score} · ↑↓←→ · p · q)`;
               scroll.scrollTop = scroll.scrollHeight;
          }

          function step() {
               if (paused) return;
               game = tick(game);
               paint();
               if (!game.alive) {
                    cleanup();
                    metaEl.textContent = `(game over · score ${game.score})`;
                    metaEl.style.color = 'var(--red)';
                    resolve();
                    return;
               }
               if (game.score >= SPEED_BUMP_AT && speed === INITIAL_SPEED_MS) {
                    speed = 110;
                    clearInterval(timer);
                    timer = setInterval(step, speed);
               }
          }

          function onKey(e) {
               if (KEY_DIRS[e.key]) {
                    e.preventDefault();
                    e.stopPropagation();
                    game.pendingDir = KEY_DIRS[e.key];
               } else if (e.key === 'q' || e.key === 'Q') {
                    e.preventDefault();
                    e.stopPropagation();
                    cleanup();
                    metaEl.textContent = `(quit · score ${game.score})`;
                    metaEl.style.color = 'var(--dim)';
                    resolve();
               } else if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    e.stopPropagation();
                    paused = !paused;
                    paint();
               }
          }

          function cleanup() {
               clearInterval(timer);
               window.removeEventListener('keydown', onKey, true);
               input.focus();
          }

          window.addEventListener('keydown', onKey, true);
          paint();
          timer = setInterval(step, speed);
     }),
};

