import { parseInput } from "./shell/parser.js";
import { Registry } from "./shell/registry.js";
import { History } from "./shell/history.js";
import { pathToCommand } from "./shell/router.js";
import { parseResume } from "./shell/resume-parser.js";
import {
  renderEcho,
  renderBlock,
  renderBox,
  renderWelcomeBox,
  showToast,
  clearScroll,
} from "./shell/render.js";

import help from "./commands/help.js";
import about from "./commands/about.js";
import projects from "./commands/projects.js";
import skills from "./commands/skills.js";
import experience from "./commands/experience.js";
import contact from "./commands/contact.js";
import resume from "./commands/resume.js";
import clear from "./commands/clear.js";
import share from "./commands/share.js";
import snake from "./commands/snake.js";
import sudo from "./commands/eggs/sudo.js";
import vim from "./commands/eggs/vim.js";
import coffee from "./commands/eggs/coffee.js";
import matrix from "./commands/eggs/matrix.js";
import init, { BANNER_ART } from "./commands/eggs/ascii.js";
import whoami from "./commands/eggs/whoami.js";

async function loadResume() {
  const res = await fetch("./resume.md", { cache: "no-store" });
  if (!res.ok) throw new Error(`resume.md not found (${res.status})`);
  return parseResume(await res.text());
}

function buildRegistry() {
  const r = new Registry();
  for (const cmd of [
    help,
    about,
    projects,
    skills,
    experience,
    contact,
    resume,
    clear,
    share,
    snake,
    sudo,
    vim,
    coffee,
    matrix,
    init,
    whoami,
  ]) {
    r.register(cmd);
  }
  return r;
}

function setupMobileFallback(resume) {
  const fallback = document.getElementById("mobile-fallback");
  if (!fallback) return;
  const m = resume.meta;
  const projectItems = resume.experience
    .flatMap((j) => j.projects)
    .map((p) => `<li><strong>${p.title}</strong> — ${p.desc}</li>`)
    .join("");
  fallback.innerHTML = `
          <h1>${m.name || "Akshansh Kumar"}</h1>
          ${m.title ? `<p><em>${m.title}</em></p>` : ""}
          <p>${resume.summary}</p>
          <h2>Projects</h2>
          <ul>${projectItems}</ul>
          <h2>Contact</h2>
          <ul>
               ${m.email ? `<li><a href="mailto:${m.email}">${m.email}</a></li>` : ""}
               ${m.linkedin ? `<li><a href="https://${m.linkedin}">${m.linkedin}</a></li>` : ""}
               ${m.github ? `<li><a href="https://${m.github}">${m.github}</a></li>` : ""}
          </ul>
     `;
}

function renderInitial(scroll) {
  const accent = (s) => `<span style="color:var(--accent)">${s}</span>`;
  const dimC = (s) => `<span style="color:var(--dim)">${s}</span>`;
  const veryDim = (s) => `<span style="color:var(--very-dim)">${s}</span>`;

  const bannerLines = BANNER_ART.split("\n").map((l) => accent(l));

  renderWelcomeBox(scroll, {
    label: `${accent("akshansh.codes")} ${dimC("v1.0")}`,
    labelText: "akshansh.codes v1.0",
    totalWidth: 117,
    leftWidth: 47,
    topLines: ["", ...bannerLines, ""],
    leftLines: [
      "Welcome!",
      "",
      dimC("Senior Software Engineer"),
      dimC("D.E. Shaw · 6 years"),
      "",
      "",
      dimC("~/akshansh"),
    ],
    rightLines: [
      accent("Tips for getting started"),
      `Run ${accent("/help")} to see all commands`,
      veryDim("─".repeat(65)),
      accent("Latest"),
      `${accent("/resume")}          view full resume`,
      `${accent("/projects")}     see what I've built`,
      `${accent("/snake")}           play snake`,
    ],
  });
}

async function main() {
  const scroll = document.getElementById("scroll");
  const promptForm = document.getElementById("prompt");
  const input = document.getElementById("prompt-input");

  renderInitial(scroll);

  let resume;
  try {
    resume = await loadResume();
  } catch (err) {
    renderBlock(scroll, {
      type: "error",
      header: "startup error",
      meta: "resume.md",
      bodyText: `${err.message} — drop your resume.md at the project root`,
    });
    return;
  }

  setupMobileFallback(resume);

  const registry = buildRegistry();
  const history = new History();
  const ctx = {
    scroll,
    resume,
    registry,
    renderBlock,
    renderEcho,
    renderBox,
    renderInitial,
    showToast,
    clearScroll,
  };

  // Initial deep-link routing only (URL is read once on load, never written
  // after — the user opted out of URL changes during in-session navigation).
  const initial = pathToCommand(location.pathname);
  if (initial.name !== "help") {
    await dispatch(initial);
  }

  promptForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = input.value;
    input.value = "";
    const parsed = parseInput(raw);
    if (parsed === null) return;
    history.push(raw);
    renderEcho(scroll, raw);
    await dispatch(parsed);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = history.prev();
      if (h !== null) input.value = h;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.next();
      if (h !== null) input.value = h;
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleTab(input, registry, scroll);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clearScroll(scroll);
      renderInitial(scroll);
    }
  });

  scroll.addEventListener("click", async (e) => {
    const link = e.target.closest(".project-name");
    if (!link) return;
    e.preventDefault();
    const slug = link.dataset.slug;
    const parsed = { name: "projects", args: [slug] };
    renderEcho(scroll, `/projects ${slug}`);
    await dispatch(parsed);
  });

  document.addEventListener("click", (e) => {
    if (
      e.target.closest(
        "a, button, .project-name, .snake-overlay, .vim-modal, input",
      )
    )
      return;
    input.focus();
  });
  input.focus();

  async function dispatch(parsed) {
    const result = await registry.dispatch(parsed, ctx);
    if (result && result.unknown) {
      const suggestion = registry.completions(result.name)[0];
      renderBlock(scroll, {
        type: "error",
        header: "command not found",
        meta: result.name,
        bodyText: suggestion ? `did you mean /${suggestion} ?` : "try /help",
      });
    }
  }
}

function handleTab(input, registry, scroll) {
  const raw = input.value.trim();
  const stripped = raw.startsWith("/") ? raw.slice(1) : raw;
  const matches = registry.completions(stripped.toLowerCase());
  if (matches.length === 0) return;
  if (matches.length === 1) {
    input.value = `/${matches[0]} `;
    return;
  }
  renderEcho(scroll, raw);
  renderBlock(scroll, {
    type: "tool",
    header: "autocomplete",
    count: matches.length,
    bodyText: matches.map((m) => `/${m}`).join("      "),
  });
}

main();
