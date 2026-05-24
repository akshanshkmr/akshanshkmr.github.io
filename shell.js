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
import resume from "./commands/resume.js";
import clear from "./commands/clear.js";
import share from "./commands/share.js";
import snake from "./commands/snake.js";
import theme from "./commands/theme.js";
import sudo from "./commands/eggs/sudo.js";
import vim from "./commands/eggs/vim.js";
import matrix from "./commands/eggs/matrix.js";
import init, { BANNER_ART } from "./commands/eggs/ascii.js";
import whoami from "./commands/eggs/whoami.js";
import dino from "./commands/eggs/dino.js";
import barrelRoll from "./commands/eggs/barrel-roll.js";
import handleChatFallback from "./commands/chat.js";
import key from "./commands/key.js";

async function loadResume() {
  const res = await fetch("./resume.md", { cache: "no-store" });
  if (!res.ok) throw new Error(`resume.md not found (${res.status})`);
  return parseResume(await res.text());
}

function buildRegistry() {
  const r = new Registry();
  for (const cmd of [
    help,
    resume,
    clear,
    share,
    snake,
    theme,
    sudo,
    vim,
    matrix,
    init,
    whoami,
    dino,
    barrelRoll,
    key,
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
               ${m.website ? `<li><a href="https://${m.website}">${m.website}</a></li>` : ""}
               ${m.linkedin ? `<li><a href="https://${m.linkedin}">${m.linkedin}</a></li>` : ""}
               ${m.github ? `<li><a href="https://${m.github}">${m.github}</a></li>` : ""}
          </ul>
     `;
}

function renderInitial(scroll) {
  // ASCII art with "> " on first line, indent on rest
  const lines = BANNER_ART.split('\n');
  const bannerText = lines.map((l, i) => (i === 0 ? l : '  ' + l)).join('\n');

  const bannerEl = document.createElement('pre');
  bannerEl.className = 'banner';
  // The '>' gets its own span so it can have a solid accent color
  // while the rest of the banner uses the CSS gradient
  bannerEl.innerHTML = `<span class="banner-gt">&gt;</span> ${bannerText}`;
  scroll.appendChild(bannerEl);

  // ── Tips ──
  const dim    = (s) => `<span style="color:var(--dim)">${s}</span>`;
  const accent = (s) => `<span style="color:var(--accent)">${s}</span>`;

  const tipsEl = document.createElement('pre');
  tipsEl.className = 'init-tips';
  tipsEl.innerHTML = [
    `<span style="color:var(--text)">Tips for getting started:</span>`,
    `${dim('1.')} ${accent('/help')}    ${dim('for a list of all commands.')}`,
    `${dim('2.')} ${accent('/resume')}  ${dim('explore my background & print a PDF.')}`,
    `${dim('3.')} ${accent('/key')}     ${dim('set up AI chat, then ask me anything.')}`,
  ].join('\n');
  scroll.appendChild(tipsEl);
}

async function main() {
  const scroll = document.getElementById("scroll");
  const promptForm = document.getElementById("prompt");
  const input = document.getElementById("prompt-input");

  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.className = ""; // clear previous themes
  document.body.classList.add(`theme-${savedTheme}`);

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

  const ghostText = document.getElementById("ghost-text");

  function updateAutosuggest() {
    const val = input.value;
    if (!val) {
      ghostText.textContent = "";
      return;
    }
    if (val.startsWith("/")) {
      const typed = val.slice(1).toLowerCase();
      if (!typed.includes(" ")) {
        const matches = registry.completions(typed);
        if (matches.length > 0) {
          ghostText.textContent = "/" + matches[0];
          return;
        }
      }
    }
    ghostText.textContent = "";
  }

  input.addEventListener("input", updateAutosuggest);

  promptForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = input.value;
    input.value = "";
    ghostText.textContent = "";

    const trimmed = raw.trim();
    if (!trimmed) return;

    const parsed = parseInput(trimmed);
    const cmdName = parsed ? parsed.name : "";
    const isSlash = trimmed.startsWith("/");
    const isRegistered = !!registry.get(cmdName);

    history.push(raw);
    renderEcho(scroll, raw);

    if (isSlash || isRegistered) {
      if (cmdName === "chat") {
        let query = trimmed.slice(5).trim();
        if (query.startsWith("/")) query = query.slice(1).trim();
        
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
          renderBlock(scroll, {
            type: 'error',
            header: 'chat',
            meta: 'key missing',
            bodyText: 'Gemini API Key is not configured. Redirecting to interactive key setup…',
          });
          await registry.dispatch({ name: 'key', args: [] }, ctx);
        } else {
          await handleChatFallback(query || "hello", ctx);
        }
      } else {
        await dispatch(parsed);
      }
    } else {
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        renderBlock(scroll, {
          type: 'error',
          header: 'chat',
          meta: 'key missing',
          bodyText: 'Gemini API Key is not configured. Redirecting to interactive key setup…',
        });
        await registry.dispatch({ name: 'key', args: [] }, ctx);
      } else {
        await handleChatFallback(trimmed, ctx);
      }
    }
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = history.prev();
      if (h !== null) {
        input.value = h;
        updateAutosuggest();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.next();
      if (h !== null) {
        input.value = h;
        updateAutosuggest();
      }
    } else if (e.key === "ArrowRight") {
      // Complete autosuggest if cursor is at the end
      if (input.selectionStart === input.value.length && ghostText.textContent) {
        e.preventDefault();
        input.value = ghostText.textContent;
        updateAutosuggest();
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (ghostText.textContent && input.value !== ghostText.textContent) {
        input.value = ghostText.textContent;
        updateAutosuggest();
      } else {
        handleTab(input, registry, scroll);
        updateAutosuggest();
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clearScroll(scroll);
      renderInitial(scroll);
      ghostText.textContent = "";
    }
  });

  document.addEventListener("click", (e) => {
    if (
      e.target.closest(
        "a, button, .snake-overlay, .vim-modal, input",
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
