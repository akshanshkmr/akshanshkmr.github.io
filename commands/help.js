const ITEMS = [
     ['/resume', 'explore Akshansh\'s resume (interactive menu)'],
     ['/contact', 'ways to get in touch'],
     ['/theme', 'change terminal color theme (interactive menu)'],
     ['/key', 'configure Gemini API key for AI chat'],
     ['/share', 'copy current URL to clipboard'],
     ['/clear', 'wipe the scroll buffer'],
     ['/snake', 'play snake in the console'],
     ['/help', 'list available commands'],
     ['[text]', 'type any question to chat with AI persona directly'],
];

const EGGS = '/sudo     /vim     /matrix     /whoami     /dino     /barrel-roll';

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

