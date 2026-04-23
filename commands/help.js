const ITEMS = [
     ['/about', 'who I am'],
     ['/projects', 'list projects (try /projects <name> for deep-dive)'],
     ['/skills', 'languages, frameworks, tools'],
     ['/experience', 'work history and education'],
     ['/contact', 'how to reach me'],
     ['/resume', 'view full resume (--pdf to download)'],
     ['/share', 'copy current URL'],
     ['/clear', 'wipe the scroll'],
     ['/snake', 'play snake'],
     ['/init', 'redraw the boot screen'],
];

const EGGS = '/sudo     /vim     /coffee     /matrix     /whoami';

export default {
     name: 'help',
     description: 'list available commands',
     run: (_args, { renderBlock, scroll }) => {
          const widest = Math.max(...ITEMS.map(([cmd]) => cmd.length));
          const rows = ITEMS.map(
               ([cmd, desc]) =>
                    `<span style="color:var(--accent)">${cmd.padEnd(widest)}</span>     <span style="color:var(--dim)">${desc}</span>`,
          ).join('\n');
          const body = `${rows}\n\n<span style="color:var(--very-dim)">easter eggs:</span>     <span style="color:var(--dim)">${EGGS}</span>`;
          renderBlock(scroll, {
               type: 'tool',
               header: 'help',
               count: ITEMS.length,
               bodyHTML: body,
          });
     },
};

