const ART = `                (     )      (      )     )
                    ) (      )     (     (
                    ( )     (          ) )
                    _____________
                   <_____________> ___
                   |                               |/ _ \\
                   |                                    | | |
                   |                                    |_| |
          ___|                               |\\___/
         /          \\___________/          \\
         \\_____________________/`;

const QUOTES = [
     ['A programmer is a machine for turning coffee into code.', 'every dev ever'],
     ['Stack Overflow runs on caffeine.', 'anonymous'],
     ['There is no cloud. It\'s just someone else\'s coffee maker.', 'anonymous'],
     ['git commit -m "after coffee"', 'universally observed'],
     ['404: cup not found. Refilling…', 'anonymous'],
     ['The best debugger is a fresh cup of coffee.', 'anonymous'],
     ['I haven\'t had my coffee yet. Don\'t make me use the void pointer.', 'anonymous'],
     ['Coffee: the most important meal of the day.', 'anonymous'],
     ['C is for coffee. That\'s good enough for me.', 'a wise muppet'],
     ['Without coffee, this site would be a 404.', 'anonymous'],
];

const TICK_MS = 800;
const COUNTDOWN = [3, 2, 1];

function statusLine(text, ready = false) {
     const color = ready ? 'var(--accent)' : 'var(--dim)';
     return `<span style="color:${color}">${text}</span>`;
}

function quoteLine() {
     const [text, who] = QUOTES[Math.floor(Math.random() * QUOTES.length)];
     return (
          `\n\n<span style="color:var(--dim)">"${text}"</span>` +
          `<span style="color:var(--very-dim)"> — ${who}</span>`
     );
}

function bodyHTML(statusHTML, quoteHTML = '') {
     return (
          `<pre style="color:var(--muted);font-family:var(--font-mono);font-size:11px;line-height:1.2;margin:0">${ART}</pre>` +
          `<div style="margin-top:6px">${statusHTML}${quoteHTML}</div>`
     );
}

export default {
     name: 'coffee',
     description: '☕',
     run: (_args, { renderBlock, scroll }) =>
          new Promise((resolve) => {
               const block = renderBlock(scroll, {
                    type: 'tool',
                    header: 'coffee',
                    bodyHTML: bodyHTML(statusLine(`brewing… ${COUNTDOWN[0]} ☕`)),
               });
               const body = block.querySelector('.body-col');
               let i = 1;
               const timer = setInterval(() => {
                    if (i < COUNTDOWN.length) {
                         body.innerHTML = bodyHTML(statusLine(`brewing… ${COUNTDOWN[i]} ☕`));
                         i++;
                    } else {
                         clearInterval(timer);
                         body.innerHTML = bodyHTML(statusLine('ready ☕', true), quoteLine());
                         scroll.scrollTop = scroll.scrollHeight;
                         resolve();
                    }
               }, TICK_MS);
          }),
};

