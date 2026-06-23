# Akshansh.codes

A premium, Claude Code TUI-style interactive terminal personal portfolio website. Visitors explore your experience, play games, and chat with your AI persona directly. Pure static SPA — no backend, zero hosting costs, and fast page loads.

## Features

- **Interactive Command Surface**: Unified keyboard-driven `/resume` and `/theme` selections.
- **Direct-Text AI Chatbot**: Type any natural language question directly in the prompt to chat with Akshansh's AI Persona (powered securely client-side by Gemini 2.5 Flash via a Bring-Your-Own-Key model).
- **Embedded Easter Eggs**: `/dino` (console cactus-runner), `/snake`, `/barrel-roll`, `/matrix`, `/whoami`, `/vim`, `/sudo`.
- **Keyboard Shortcuts**: Arrow up/down command history, Tab/ArrowRight autocompletion, and `Ctrl+L` to clear.
- **ATS-Friendly Print Variant**: Clean modern slate PDF download available in `/resume` printing configurations.

## Setup & Local Development

Because this is a modern ES module static application, you must run it through a local HTTP server to bypass browser CORS security restrictions (do not double-click `index.html` to open as `file://`).

1. Navigate to the project root:
   ```bash
   cd akshanshkmr.github.io
   ```
2. Serve locally via Python (built-in on macOS):
   ```bash
   python3 -m http.server 8000
   ```
3. Open in your browser:
   ```
   http://localhost:8000
   ```

## Deploying

Simply commit and push your changes to `main`. The included GitHub Action workflow `.github/workflows/static.yml` automatically builds and deploys the static files to GitHub Pages.
