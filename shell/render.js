// Cached pixel width of one monospace cell. Measured lazily on first use.
let _cellWidth = null;

function measureCellsBatch(scroll, texts) {
     if (texts.length === 0) return [];
     if (_cellWidth == null) {
          const p = document.createElement('span');
          p.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;';
          p.textContent = '0'.repeat(20);
          scroll.appendChild(p);
          _cellWidth = p.getBoundingClientRect().width / 20;
          scroll.removeChild(p);
     }
     const probes = texts.map((t) => {
          const s = document.createElement('span');
          s.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;';
          s.textContent = t || ' ';
          return s;
     });
     probes.forEach((p) => scroll.appendChild(p));
     const widths = probes.map((p) => Math.round(p.getBoundingClientRect().width / _cellWidth));
     probes.forEach((p) => scroll.removeChild(p));
     return widths.map((w, i) => (texts[i] ? w : 0));
}

/**
    * Render an echo of the user's command into the scroll: `> /projects`.
    */
export function renderEcho(scroll, raw) {
     const div = document.createElement('div');
     div.className = 'user-line';
     const gt = document.createElement('span');
     gt.className = 'gt';
     gt.textContent = '>';
     const text = document.createElement('span');
     text.className = 'text';
     text.textContent = ' ' + raw.trim();
     div.append(gt, text);
     scroll.appendChild(div);
     scroll.scrollTop = scroll.scrollHeight;
}

/**
    * Render a Claude Code-style tool block:
    *      ⏺ name(meta · 0.2s)
    *           ⎿     body...
    *
    * options: { type: 'tool' | 'error', header, meta, count, durationMs, bodyHTML, bodyText }
    *      - type: 'tool' (green ⏺) or 'error' (red ⏺)
    *      - header: name shown after the dot (e.g., "list_projects", "command not found")
    *      - meta: free-text inside the parens (e.g., "banana", "ai-knowledge-assistant · 2024")
    *      - count: integer that adds "(N results)" to the parens
    *      - durationMs: number that adds "0.Xs" to the parens
    *      - bodyHTML / bodyText: body content rendered after the `⎿` branch
    */
export function renderBlock(scroll, options) {
     const {
          type = 'tool',
          header,
          meta,
          count,
          durationMs,
          bodyHTML,
          bodyText,
     } = options;

     const wrap = document.createElement('div');
     wrap.className = `tool tool--${type}`;

     // Header line: ⏺ name(meta · count results · 0.2s)
     const head = document.createElement('div');
     head.className = 'tool-head';
     const dot = document.createElement('span');
     dot.className = 'dot';
     dot.textContent = '⏺ ';
     const name = document.createElement('span');
     name.className = 'name';
     name.textContent = header || '';

     const metaParts = [];
     if (meta) metaParts.push(meta);
     if (count != null) metaParts.push(`${count} result${count === 1 ? '' : 's'}`);
     if (durationMs != null) metaParts.push(`${(durationMs / 1000).toFixed(1)}s`);
     const metaSpan = document.createElement('span');
     metaSpan.className = 'meta';
     metaSpan.textContent = metaParts.length ? `(${metaParts.join(' · ')})` : '';

     head.append(dot, name, metaSpan);
     wrap.appendChild(head);

     if (bodyHTML != null || bodyText != null) {
          const body = document.createElement('div');
          body.className = 'tool-body';
          const branch = document.createElement('span');
          branch.className = 'branch-col';
          branch.textContent = '     ⎿     ';
          const inner = document.createElement('div');
          inner.className = 'body-col';
          if (bodyHTML != null) inner.innerHTML = bodyHTML;
          else inner.textContent = bodyText;
          body.append(branch, inner);
          wrap.appendChild(body);
     }

     scroll.appendChild(wrap);
     scroll.scrollTop = scroll.scrollHeight;
     return wrap;
}

/**
    * Render a Claude-Code-style bordered box (used for the welcome screen).
    * Built entirely from box-drawing characters in a <pre>, so corners, sides,
    * and edges all sit on the same monospace character grid — pixel-perfect.
    *
    *      ╭─ ✻ welcome ─────────────╮
    *      │ <line>                              <pad> │
    *      ╰─────────────────────────╯
    *
    * options: { label?: HTML, lines: HTML[], width?: number (chars) }
    *      - label: HTML rendered inline in the top border (kept short)
    *      - lines: array of HTML strings, one per body row
    *      - width: total character width including borders. Defaults to
    *                              max(longestLine + 4, labelCells + 6, 84).
    *
    * Uses DOM measurement (not String.length) for visible width, so wide
    * glyphs like ✻, emojis, and CJK characters align correctly even when
    * they occupy more than one monospace cell.
    */
export function renderBox(scroll, { label, lines = [], width }) {
     const stripHtml = (s) => {
          if (s == null) return '';
          const tmp = document.createElement('div');
          tmp.innerHTML = s;
          return tmp.textContent || '';
     };

     // Measure all pieces in one batch — append all probes, read all widths,
     // remove all probes. One reflow for the whole box instead of one per line.
     const labelText = label ? stripHtml(label) : '';
     const linesText = lines.map((l) => stripHtml(l));
     const widths = measureCellsBatch(scroll, [labelText, ...linesText]);
     const labelCells = widths[0];
     const lineWidths = widths.slice(1);
     const longest = lineWidths.reduce((m, n) => Math.max(m, n), 0);
     const W = width ?? Math.max(longest + 4, labelCells + 6, 84);
     const inner = W - 2;
     const dim = (s) => `<span class="cc-dim">${s}</span>`;

     let top;
     if (label) {
          const dashes = inner - 3 - labelCells; // ╭─ + space + label + space + dashes + ╮
          top = dim('╭─ ') + label + ' ' + dim('─'.repeat(Math.max(0, dashes)) + '╮');
     } else {
          top = dim('╭' + '─'.repeat(inner) + '╮');
     }

     const bodyRows = lines
          .map((line, i) => {
               const padding = ' '.repeat(Math.max(0, inner - 1 - lineWidths[i]));
               return dim('│') + ' ' + line + padding + dim('│');
          })
          .join('\n');

     const bot = dim('╰' + '─'.repeat(inner) + '╯');

     const box = document.createElement('pre');
     box.className = 'text-box';
     box.innerHTML = `${top}\n${bodyRows}\n${bot}`;
     scroll.appendChild(box);
     scroll.scrollTop = scroll.scrollHeight;
     return box;
}

/**
    * Render the ASCII banner at the top of the scroll.
    */
export function renderBanner(scroll, art) {
     const div = document.createElement('div');
     div.className = 'banner';
     div.textContent = art;
     scroll.appendChild(div);
}

/**
    * Render a Claude-Code-style two-column welcome box:
    *
    *      ╭─── label ─────────...─╮
    *      │     left col centered          │     right col left-aligned │
    *      │     ...                                             │     ...                                                  │
    *      ╰───────────────────...─╯
    *
    * Caller provides parallel left/right line arrays. Lines may contain HTML
    * (spans for color); visible widths are computed by stripping tags.
    *
    * options: { label, labelText, leftLines[], rightLines[], totalWidth, leftWidth }
    */
export function renderWelcomeBox(scroll, opts) {
     const TOTAL = opts.totalWidth || 117;
     const LEFT = opts.leftWidth || 47;
     const RIGHT = TOTAL - LEFT - 3; // 3 char-cells for borders: ╭│╮
     const stripHtml = (s) => String(s).replace(/<[^>]+>/g, '');
     const visLen = (s) => stripHtml(s).length;
     const dim = (s) => `<span style="color:var(--very-dim)">${s}</span>`;

     const padCenter = (s, w) => {
          const gap = Math.max(0, w - visLen(s));
          const l = Math.floor(gap / 2);
          return ' '.repeat(l) + s + ' '.repeat(gap - l);
     };
     const padRight = (s, w) => s + ' '.repeat(Math.max(0, w - visLen(s)));

     const labelLen = visLen(opts.labelText || opts.label || '');
     const topDashes = Math.max(0, TOTAL - 7 - labelLen); // "╭─── " (5) + " " + "╮" (1) = 7
     const top =
          dim('╭─── ') + (opts.label || '') + dim(' ' + '─'.repeat(topDashes) + '╮');

     const FULL_INNER = TOTAL - 2; // inside outer │ │ borders
     const rows = [];

     // Full-width rows (banner, etc) — span the entire box width, no internal divider
     const topLines = opts.topLines || [];
     for (const line of topLines) {
          rows.push(dim('│') + padCenter(line, FULL_INNER) + dim('│'));
     }

     // Two-column rows
     const left = opts.leftLines || [];
     const right = opts.rightLines || [];
     const maxRows = Math.max(left.length, right.length);
     for (let i = 0; i < maxRows; i++) {
          const l = padCenter(left[i] || '', LEFT);
          const r = padRight(' ' + (right[i] || ''), RIGHT);
          rows.push(dim('│') + l + dim('│') + r + dim('│'));
     }

     const bot = dim('╰' + '─'.repeat(TOTAL - 2) + '╯');

     const pre = document.createElement('pre');
     pre.className = 'welcome-box';
     pre.innerHTML = [top, ...rows, bot].join('\n');
     scroll.appendChild(pre);
     scroll.scrollTop = scroll.scrollHeight;
     return pre;
}

/**
    * Show a transient toast notification at the bottom.
    */
export function showToast(message, durationMs = 1800) {
     const toast = document.getElementById('toast');
     if (!toast) return;
     toast.textContent = message;
     toast.classList.add('toast--visible');
     clearTimeout(toast._timer);
     toast._timer = setTimeout(() => {
          toast.classList.remove('toast--visible');
     }, durationMs);
}

/**
    * Clear the scroll buffer.
    */
export function clearScroll(scroll) {
     scroll.innerHTML = '';
}

