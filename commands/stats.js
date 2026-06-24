// /stats — visitor counts pulled from GoatCounter's public counter endpoint.
// Requires "Allow using the visitor counter" enabled in GoatCounter settings.

const COUNTER_URL = 'https://akshanshkmr.goatcounter.com/counter/TOTAL.json';

export async function fetchTotals() {
     const res = await fetch(COUNTER_URL, { cache: 'no-store' });
     if (!res.ok) throw new Error(`goatcounter ${res.status}`);
     const data = await res.json();
     return { count: data.count, countUnique: data.count_unique };
}

export default {
     name: 'stats',
     description: 'show visitor stats for this site',
     run: async (_args, { renderBlock, scroll }) => {
          const block = renderBlock(scroll, {
               type: 'tool',
               header: 'stats',
               meta: 'goatcounter',
               bodyText: 'fetching…',
          });
          const body = block.querySelector('.body-col');

          try {
               const { count, countUnique } = await fetchTotals();
               const rows = [
                    ['total views', count],
                    ['unique visitors', countUnique],
               ].filter(([, v]) => v != null);
               const widest = Math.max(...rows.map(([k]) => k.length));
               body.innerHTML = rows
                    .map(([k, v]) =>
                         `<span style="color:var(--dim)">${k.padEnd(widest)}</span>   <strong style="color:var(--accent)">${v}</strong>`)
                    .join('\n');
          } catch (err) {
               block.classList.add('tool--error');
               body.innerHTML =
                    `<span style="color:var(--red)">visitor stats aren't public yet.</span>\n` +
                    `Enable <span style="color:var(--accent)">Allow using the visitor counter</span> ` +
                    `in GoatCounter → Settings → Site settings.`;
          }
          scroll.scrollTop = scroll.scrollHeight;
     },
};
