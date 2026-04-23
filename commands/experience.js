function jobsHTML(jobs) {
     return jobs
          .map((j) => {
               const head = [j.role, j.company, j.date].filter(Boolean).join(' · ');
               const projects = j.projects
                    .map(
                         (p) =>
                              `\n<span style="color:var(--cyan)">⏵ ${p.title}</span>\n${p.desc}`,
                    )
                    .join('\n');
               return `<strong>${head}</strong>${projects}`;
          })
          .join('\n\n\n');
}

function eduHTML(rows) {
     return rows
          .map((r) => [r[0], r[1], r[2], r[3]].filter(Boolean).join(' · '))
          .join('\n');
}

function achHTML(items) {
     return items
          .map(
               (a) =>
                    `<span style="color:var(--very-dim)">·</span> ${a.text}${a.year ? ` <span style="color:var(--dim)">· ${a.year}</span>` : ''}`,
          )
          .join('\n');
}

const sectionHead = (title) =>
     `<span style="color:var(--very-dim)">## </span>` +
     `<span style="color:var(--accent);font-weight:600">${title}</span>`;

export default {
     name: 'experience',
     description: 'work history and education',
     run: (_args, { renderBlock, scroll, resume }) => {
          const parts = [];
          if (resume.experience.length) parts.push(jobsHTML(resume.experience));
          if (resume.education.length)
               parts.push(`${sectionHead('Education')}\n\n${eduHTML(resume.education)}`);
          if (resume.achievements.length)
               parts.push(
                    `${sectionHead('Achievements')}\n\n${achHTML(resume.achievements)}`,
               );
          renderBlock(scroll, {
               type: 'tool',
               header: 'experience',
               bodyHTML: parts.join('\n\n\n'),
          });
     },
};

