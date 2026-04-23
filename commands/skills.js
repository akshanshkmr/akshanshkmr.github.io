export default {
     name: 'skills',
     description: 'languages, frameworks, tools',
     run: (_args, { renderBlock, scroll, resume }) => {
          const rows = resume.skills;
          if (!rows.length) {
               renderBlock(scroll, {
                    type: 'tool',
                    header: 'skills',
                    bodyText: '(no skills section in resume.md)',
               });
               return;
          }
          const widest = Math.max(...rows.map((r) => r[0].length));
          const total = rows.reduce(
               (n, r) => n + r[1].split(',').filter(Boolean).length,
               0,
          );
          const html = rows
               .map(
                    (r) =>
                         `<span style="color:var(--dim)">${r[0].padEnd(widest)}</span>     ${r[1]}`,
               )
               .join('\n');
          renderBlock(scroll, {
               type: 'tool',
               header: 'skills',
               count: total,
               bodyHTML: html,
          });
     },
};

