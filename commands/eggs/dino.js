export default {
     name: 'dino',
     description: 'play chrome dino in the console!',
     run: (_args, { renderBlock, scroll }) => new Promise((resolve) => {
          const input = document.getElementById("prompt-input");
          input.blur();
          input.readOnly = true;

          const block = renderBlock(scroll, {
               type: 'tool',
               header: 'dino',
               meta: 'game',
               bodyHTML: '',
          });
          const bodyCol = block.querySelector(".body-col");

          let score = 0;
          let dinoY = 0; // 0 = ground, 1 = air
          let jumpTicks = 0; // Jump height frames
          let trackLen = 50;
          let cacti = [35, 48];
          
          let gameInterval = null;

          function paint() {
               // Render air line
               let airLine = '';
               for (let i = 0; i < trackLen; i++) {
                    if (i === 3 && dinoY === 1) airLine += '<span style="display: inline-block; transform: scaleX(-1);">🦖</span>';
                    else airLine += ' ';
               }

               // Render ground line
               let groundLine = '';
               for (let i = 0; i < trackLen; i++) {
                    if (i === 3 && dinoY === 0) {
                         groundLine += '<span style="display: inline-block; transform: scaleX(-1);">🦖</span>';
                    } else if (cacti.includes(i)) {
                         groundLine += '🌵';
                    } else {
                         groundLine += '_';
                    }
               }

               const header = `<span style="color:var(--accent);font-weight:bold">🦖 CHROMIUM DINO RUNNER 🌵</span>`;
               const scoreLine = `<span style="color:var(--cyan);font-weight:bold">Score: ${String(score).padStart(3, '0')}</span>`;
               
               bodyCol.innerHTML = `${header}  ·  ${scoreLine}\n\n${airLine}\n${groundLine}\n\n<span style="color:var(--dim)">[Press Space to Jump, Esc to Exit]</span>`;
               scroll.scrollTop = scroll.scrollHeight;
          }

          function gameOver() {
               clearInterval(gameInterval);
               window.removeEventListener('keydown', onKey, true);
               
               const header = `<span style="color:var(--red);font-weight:bold">🦖 GAME OVER! 🌵</span>`;
               const scoreLine = `<span style="color:var(--cyan);font-weight:bold">Final Score: ${score}</span>`;
               bodyCol.innerHTML = `${header}  ·  ${scoreLine}\n\nPress enter or escape to return.`;
               
               function restoreKey(e) {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                         e.preventDefault();
                         e.stopPropagation();
                         window.removeEventListener('keydown', restoreKey, true);
                         input.readOnly = false;
                         input.focus();
                         resolve();
                    }
               }
               window.addEventListener('keydown', restoreKey, true);
          }

          function cleanup() {
               clearInterval(gameInterval);
               window.removeEventListener('keydown', onKey, true);
               input.readOnly = false;
               setTimeout(() => {
                    input.focus();
               }, 50);
               bodyCol.innerHTML = `<span style="color:var(--dim)">dino game exited (score: ${score})</span>`;
               resolve();
          }

          function update() {
               // Update Jump state
               if (dinoY === 1) {
                    jumpTicks++;
                    if (jumpTicks >= 4) {
                         dinoY = 0;
                         jumpTicks = 0;
                    }
               }

               // Move Cacti left
               cacti = cacti.map((c) => c - 1);
               
               // Check Collisions
               if (cacti.includes(3) && dinoY === 0) {
                    gameOver();
                    return;
               }

               // Filter offscreen cacti and reward points
               const initialCount = cacti.length;
               cacti = cacti.filter((c) => c >= 0);
               const pointsEarned = initialCount - cacti.length;
               score += pointsEarned * 10;

               // Spawn new cacti
               if (cacti.length === 0 || (cacti[cacti.length - 1] < trackLen - 15 && Math.random() < 0.25)) {
                    cacti.push(trackLen - 1);
               }

               paint();
          }

          function onKey(e) {
               if (e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dinoY === 0) {
                         dinoY = 1;
                         jumpTicks = 0;
                         paint();
                    }
               } else if (e.key === 'Escape' || (e.key === 'c' && e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    cleanup();
               }
          }

          window.addEventListener('keydown', onKey, true);
          paint();
          
          gameInterval = setInterval(update, 100); // 100ms ticks
     }),
};
