export default {
     name: 'contact',
     description: 'how to reach me',
     run: (_args, { renderBlock, scroll, resume }) => {
          const m = resume.meta;
          const items = [];
          if (m.email) items.push(['email', `<a href="mailto:${m.email}">${m.email}</a>`]);
          if (m.phone) items.push(['phone', m.phone]);
          if (m.location) items.push(['location', m.location]);
          if (m.linkedin) items.push(['linkedin', `<a href="https://${m.linkedin}">${m.linkedin}</a>`]);
          if (m.github) items.push(['github', `<a href="https://${m.github}">${m.github}</a>`]);
          const widest = Math.max(0, ...items.map((i) => i[0].length));
          const html = items
               .map(
                    ([k, v]) => `<span style="color:var(--dim)">${k.padEnd(widest)}</span>     ${v}`,
               )
               .join('\n');
          renderBlock(scroll, { type: 'tool', header: 'contact', bodyHTML: html });
     },
};

