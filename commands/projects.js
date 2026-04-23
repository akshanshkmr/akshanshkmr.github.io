function slugify(s) {
     return s
          .toLowerCase()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
}

function flatProjects(resume) {
     return resume.experience.flatMap((j) =>
          j.projects.map((p) => ({ ...p, company: j.company, slug: slugify(p.title) })),
     );
}

function listView(projects, renderBlock, scroll) {
     if (!projects.length) {
          renderBlock(scroll, {
               type: 'tool',
               header: 'list_projects',
               bodyText: '(no projects in resume.md)',
          });
          return;
     }
     const widest = Math.max(...projects.map((p) => p.slug.length));
     const rows = projects
          .map((p) => {
               const slug = `<a class="project-name" data-slug="${p.slug}" href="/projects/${p.slug}">${p.slug}</a>`;
               const padding = ' '.repeat(widest - p.slug.length + 2);
               const summary = p.desc.split('. ')[0].replace(/[.\s]*$/, '');
               return `${slug}${padding}<span style="color:var(--dim)">${summary}</span>`;
          })
          .join('\n');
     renderBlock(scroll, {
          type: 'tool',
          header: 'list_projects',
          count: projects.length,
          durationMs: 200,
          bodyHTML: rows,
     });
}

function detailView(project, renderBlock, scroll) {
     renderBlock(scroll, {
          type: 'tool',
          header: 'project',
          meta: project.slug,
          bodyHTML: `<span style="color:var(--cyan)">${project.title}</span>\n\n${project.desc}`,
     });
}

export default {
     name: 'projects',
     description: 'list projects or open a deep-dive',
     run: (args, { renderBlock, scroll, resume }) => {
          const projects = flatProjects(resume);
          if (args.length === 0) {
               listView(projects, renderBlock, scroll);
               return;
          }
          const project = projects.find((p) => p.slug === args[0]);
          if (!project) {
               renderBlock(scroll, {
                    type: 'error',
                    header: 'project not found',
                    meta: args[0],
                    bodyText: 'try /projects to see the full list',
               });
               return;
          }
          detailView(project, renderBlock, scroll);
     },
};

