# Akshansh.codes

A Claude Code TUI-style personal portfolio. Visitors interact via slash commands like `/projects`, `/about`, `/resume`, `/snake`. Pure static site — no backend, no build step, no dependencies.


## Content

Everything reads from `resume.md` at the project root. Update that file and every command (`/about`, `/contact`, `/skills`, `/experience`, `/projects`, `/resume`) reflects the change automatically. No build to run.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` stages the static files and ships them to GitHub Pages.

## Commands

- `/help` — list commands
- `/about`, `/contact`, `/skills`, `/experience` — sections from `resume.md`
- `/projects` — list projects, click any (or `/projects <slug>`) for the deep-dive
- `/resume` — full resume inline; `/resume --pdf` to download
- `/share` — copy current URL
- `/clear` or `Ctrl+L` — wipe scroll
- `/snake`, `/vim`, `/matrix`, `/sudo`, `/coffee`, `/banner`, `/whoami` — easter eggs
- `Tab` autocompletes; `↑`/`↓` walk history

