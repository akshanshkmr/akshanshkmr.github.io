export default {
     name: 'about',
     description: 'who I am',
     run: (_args, { renderBlock, scroll, resume }) => {
          const m = resume.meta;
          const headerLines = [
               `<strong style="color:var(--accent)">${m.name || ''}</strong>${m.title ? ` <span style="color:var(--cyan)">· ${m.title}</span>` : ''}`,
               m.location ? `<span style="color:var(--dim)">${m.location}</span>` : '',
          ].filter(Boolean);
          const body = headerLines.join('\n') + (resume.summary ? `\n\n${resume.summary}` : '');
          renderBlock(scroll, { type: 'tool', header: 'about', bodyHTML: body });
     },
};

