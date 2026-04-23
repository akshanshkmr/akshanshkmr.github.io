// Resume markdown parser + single ATS-friendly renderer.
// Pure functions — return HTML strings, no DOM mutation.

function parseFrontmatter(md) {
     const m = md.match(/^---\n([\s\S]*?)\n---/);
     if (!m) return [{}, md];
     const meta = {};
     m[1].split('\n').forEach((l) => {
          const i = l.indexOf(':');
          if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
     });
     return [meta, md.slice(m[0].length).trim()];
}

function parseSections(body) {
     const out = [];
     let cur = null;
     body.split('\n').forEach((l) => {
          if (/^# /.test(l)) {
               cur = { title: l.slice(2), lines: [] };
               out.push(cur);
          } else if (cur) {
               cur.lines.push(l);
          }
     });
     return out.map((s) => ({ title: s.title, content: s.lines.join('\n').trim() }));
}

function parseTableRows(text) {
     return text
          .split('\n')
          .filter((l) => l.startsWith('|'))
          .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean))
          .filter((r) => r.length >= 2);
}

function parseExperience(text) {
     const jobs = [];
     let job = null;
     let proj = null;
     text.split('\n').forEach((l) => {
          if (/^## /.test(l)) {
               const p = l.slice(3).split('|').map((s) => s.trim());
               job = { role: p[0], company: p[1] || '', date: p[2] || '', projects: [] };
               jobs.push(job);
               proj = null;
          } else if (/^### /.test(l) && job) {
               proj = { title: l.slice(4), desc: [] };
               job.projects.push(proj);
          } else if (proj && l.trim()) {
               proj.desc.push(l.trim());
          }
     });
     jobs.forEach((j) => j.projects.forEach((p) => (p.desc = p.desc.join(' '))));
     return jobs;
}

function parseListItems(text) {
     return text
          .split('\n')
          .filter((l) => l.startsWith('- '))
          .map((l) => {
               const p = l.slice(2).split('|').map((s) => s.trim());
               return { text: p[0], year: p[1] || '' };
          });
}

function boldify(s) {
     return s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function escapeHtml(s) {
     return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

// ── Section renderers ─────────────────────────────

function renderHeader(meta) {
     const contact = [];
     if (meta.email) contact.push(`<a href="mailto:${escapeHtml(meta.email)}">${escapeHtml(meta.email)}</a>`);
     if (meta.phone) contact.push(`<a href="tel:${meta.phone.replace(/\s/g, '')}">${escapeHtml(meta.phone)}</a>`);
     if (meta.location) contact.push(`<span>${escapeHtml(meta.location)}</span>`);
     ['linkedin', 'github', 'website', 'portfolio'].forEach((k) => {
          if (meta[k]) contact.push(`<a href="https://${escapeHtml(meta[k])}">${escapeHtml(meta[k])}</a>`);
     });
     return `
          <header class="r-head">
               <h1>${escapeHtml(meta.name || '')}</h1>
               ${meta.title ? `<div class="r-title">${escapeHtml(meta.title)}</div>` : ''}
               <div class="r-contact">${contact.join('<span class="r-sep">·</span>')}</div>
          </header>`;
}

function renderSummary(content) {
     return `
          <section class="r-section">
               <h2>Summary</h2>
               <p>${boldify(content)}</p>
          </section>`;
}

function renderSkills(content) {
     const rows = parseTableRows(content);
     return `
          <section class="r-section">
               <h2>Skills</h2>
               <dl class="r-skills">
                    ${rows.map((r) => `<dt>${escapeHtml(r[0])}</dt><dd>${escapeHtml(r[1])}</dd>`).join('')}
               </dl>
          </section>`;
}

function renderExperience(content) {
     const jobs = parseExperience(content);
     const html = jobs
          .map(
               (j) => `
               <article class="r-job">
                    <div class="r-job-head">
                         <h3>${escapeHtml(j.role)}</h3>
                         <span class="r-date">${escapeHtml(j.date)}</span>
                    </div>
                    ${j.company ? `<div class="r-company">${escapeHtml(j.company)}</div>` : ''}
                    <div class="r-projects">
                         ${j.projects
                              .map(
                                   (p) => `
                              <article class="r-proj">
                                   <h4>${escapeHtml(p.title)}</h4>
                                   <p>${boldify(p.desc)}</p>
                              </article>`,
                              )
                              .join('')}
                    </div>
               </article>`,
          )
          .join('');
     return `
          <section class="r-section">
               <h2>Experience</h2>
               ${html}
          </section>`;
}

function renderEducation(content) {
     const rows = parseTableRows(content);
     const html = rows
          .map((r) => {
               const detail = [r[1], r[3]].filter(Boolean).join(' · ');
               return `
                    <article class="r-edu">
                         <div class="r-job-head">
                              <h3>${escapeHtml(r[0])}</h3>
                              <span class="r-date">${escapeHtml(r[2] || '')}</span>
                         </div>
                         ${detail ? `<div class="r-edu-detail">${escapeHtml(detail)}</div>` : ''}
                    </article>`;
          })
          .join('');
     return `
          <section class="r-section">
               <h2>Education</h2>
               ${html}
          </section>`;
}

function renderAchievements(content) {
     const items = parseListItems(content);
     return `
          <section class="r-section">
               <h2>Achievements</h2>
               <ul class="r-ach">
                    ${items
                         .map(
                              (a) => `
                         <li>
                              <span>${boldify(a.text)}</span>
                              ${a.year ? `<span class="r-date">${escapeHtml(a.year)}</span>` : ''}
                         </li>`,
                         )
                         .join('')}
               </ul>
          </section>`;
}

function renderGeneric(title, content) {
     const items = parseListItems(content);
     if (items.length) {
          return `
               <section class="r-section">
                    <h2>${escapeHtml(title)}</h2>
                    <ul class="r-ach">
                         ${items
                              .map((i) => `<li><span>${boldify(i.text)}</span>${i.year ? `<span class="r-date">${escapeHtml(i.year)}</span>` : ''}</li>`)
                              .join('')}
                    </ul>
               </section>`;
     }
     return `
          <section class="r-section">
               <h2>${escapeHtml(title)}</h2>
               <p>${boldify(content)}</p>
          </section>`;
}

const SECTION_RENDERERS = {
     summary: renderSummary,
     skills: renderSkills,
     experience: renderExperience,
     education: renderEducation,
     achievements: renderAchievements,
};

// ── Terminal-native renderer (for TUI inline display) ─────────

// Pure text with `\n` line breaks — exactly the same approach as /projects
// listing. body-col has `white-space: pre-wrap` so newlines render as line
// breaks. `\n\n` between sections produces a visible blank line.

function tuiContact(meta) {
     const parts = [];
     if (meta.email) parts.push(`<a href="mailto:${escapeHtml(meta.email)}">${escapeHtml(meta.email)}</a>`);
     if (meta.phone) parts.push(escapeHtml(meta.phone));
     if (meta.location) parts.push(escapeHtml(meta.location));
     ['linkedin', 'github', 'website', 'portfolio'].forEach((k) => {
          if (meta[k]) parts.push(`<a href="https://${escapeHtml(meta[k])}">${escapeHtml(meta[k])}</a>`);
     });
     return parts.join(' · ');
}

const padRight = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));

function sectionHead(title) {
     return (
          `<span style="color:var(--very-dim)">## </span>` +
          `<span style="color:var(--accent);font-weight:600">${escapeHtml(title)}</span>`
     );
}

function tuiSkills(c) {
     const rows = parseTableRows(c);
     if (!rows.length) return '';
     const widest = Math.max(...rows.map((r) => r[0].length));
     return rows
          .map(
               (r) =>
                    `<span style="color:var(--dim)">${escapeHtml(padRight(r[0], widest))}</span>     ${escapeHtml(r[1])}`,
          )
          .join('\n');
}

function tuiExp(c) {
     return parseExperience(c)
          .map((j) => {
               const head = [j.role, j.company, j.date].filter(Boolean).map(escapeHtml).join(' · ');
               const projects = j.projects
                    .map(
                         (p) =>
                              `<span style="color:var(--cyan)">⏵ ${escapeHtml(p.title)}</span>\n${boldify(p.desc)}`,
                    )
                    .join('\n\n');
               return `<strong>${head}</strong>\n\n${projects}`;
          })
          .join('\n\n\n');
}

function tuiEdu(c) {
     return parseTableRows(c)
          .map((r) => [r[0], r[1], r[2], r[3]].filter(Boolean).map(escapeHtml).join(' · '))
          .join('\n');
}

function tuiAch(c) {
     return parseListItems(c)
          .map(
               (a) =>
                    `<span style="color:var(--very-dim)">·</span> ${boldify(a.text)}${a.year ? ` <span style="color:var(--dim)">· ${escapeHtml(a.year)}</span>` : ''}`,
          )
          .join('\n');
}

const TUI_SECTION_RENDERERS = {
     summary: (c) => boldify(c),
     skills: tuiSkills,
     experience: tuiExp,
     education: tuiEdu,
     achievements: tuiAch,
};

function tuiHeader(meta) {
     let h = `<strong style="color:var(--accent);font-size:15px">${escapeHtml(meta.name || '')}</strong>`;
     if (meta.title) h += ` <span style="color:var(--cyan)">· ${escapeHtml(meta.title)}</span>`;
     h += `\n<span style="color:var(--dim);font-size:12px">${tuiContact(meta)}</span>`;
     return h;
}

// ── Public API ─────────────────────────────────────

export function parseResume(md) {
     const [meta, body] = parseFrontmatter(md);
     const sections = parseSections(body);
     const byName = {};
     for (const s of sections) byName[s.title.toLowerCase()] = s;
     return {
          meta,
          sections,
          summary: byName.summary?.content || '',
          skills: byName.skills ? parseTableRows(byName.skills.content) : [],
          experience: byName.experience ? parseExperience(byName.experience.content) : [],
          education: byName.education ? parseTableRows(byName.education.content) : [],
          achievements: byName.achievements ? parseListItems(byName.achievements.content) : [],
     };
}

export function renderResume({ meta, sections }) {
     let body = renderHeader(meta);
     for (const sec of sections) {
          const fn = SECTION_RENDERERS[sec.title.toLowerCase()];
          body += fn ? fn(sec.content) : renderGeneric(sec.title, sec.content);
     }
     return body;
}

export function renderResumeTerminal({ meta, sections }) {
     // Pure text with literal `\n\n` line breaks for visible blank lines —
     // both in the rendered view AND in any copy-pasted text. Drops the
     // flex+gap wrapper since CSS gap doesn't translate to copyable blanks.
     let body = tuiHeader(meta);
     for (const sec of sections) {
          const fn = TUI_SECTION_RENDERERS[sec.title.toLowerCase()];
          const content = fn ? fn(sec.content) : boldify(sec.content);
          body += `\n\n${sectionHead(sec.title)}\n\n${content}`;
     }
     return body;
}

