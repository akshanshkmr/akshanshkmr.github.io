// /contact — surface the ways to reach Akshansh, pulled from resume.md frontmatter.

function link(href, text) {
     return `<a href="${href}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:none;">${text}</a>`;
}

export default {
     name: 'contact',
     description: 'show ways to get in touch',
     run: (_args, { renderBlock, scroll, resume }) => {
          const m = (resume && resume.meta) || {};
          const url = (u) => (/^https?:\/\//.test(u) ? u : `https://${u}`);

          const rows = [];
          if (m.email)    rows.push(['email',    link(`mailto:${m.email}`, m.email)]);
          if (m.linkedin) rows.push(['linkedin', link(url(m.linkedin), m.linkedin)]);
          if (m.github)   rows.push(['github',   link(url(m.github), m.github)]);
          if (m.portfolio) rows.push(['web',     link(url(m.portfolio), m.portfolio)]);
          if (m.location) rows.push(['location', `<span style="color:var(--text)">${m.location}</span>`]);

          const widest = Math.max(...rows.map(([k]) => k.length));
          const body = rows
               .map(([k, v]) => `<span style="color:var(--dim)">${k.padEnd(widest)}</span>   ${v}`)
               .join('\n');

          renderBlock(scroll, {
               type: 'tool',
               header: 'contact',
               count: rows.length,
               bodyHTML: body,
          });
     },
};
