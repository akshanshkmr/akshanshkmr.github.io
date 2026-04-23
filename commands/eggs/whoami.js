function detectBrowser(ua) {
     if (/Edg\//.test(ua)) return 'Edge';
     if (/Firefox\//.test(ua)) return 'Firefox';
     if (/Chrome\//.test(ua)) return 'Chrome';
     if (/Safari\//.test(ua)) return 'Safari';
     return 'unknown';
}

function detectOs(ua) {
     if (/iPhone|iPad/.test(ua)) return 'iOS';
     if (/Android/.test(ua)) return 'Android';
     if (/Mac/.test(ua)) return 'macOS';
     if (/Windows/.test(ua)) return 'Windows';
     if (/Linux/.test(ua)) return 'Linux';
     return 'unknown';
}

function escapeHtml(s) {
     return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

function row(label, value) {
     return `<span style="color:var(--dim)">${label}</span>     <span style="color:var(--text)">${escapeHtml(value)}</span>`;
}

export default {
     name: 'whoami',
     description: 'visitor info (ip, location, browser)',
     run: async (_args, { renderBlock, scroll }) => {
          const ua = navigator.userAgent;
          const browser = detectBrowser(ua);
          const os = detectOs(ua);
          const lang = navigator.language || 'unknown';

          let geo = null;
          let geoError = null;
          let elapsed;
          const ac = new AbortController();
          const timeoutId = setTimeout(() => ac.abort(), 5000);
          try {
               const start = performance.now();
               const res = await fetch('https://ipapi.co/json/', {
                    cache: 'no-store',
                    signal: ac.signal,
               });
               elapsed = performance.now() - start;
               if (!res.ok) {
                    geoError = `HTTP ${res.status} ${res.statusText || ''}`.trim();
               } else {
                    const data = await res.json();
                    if (data.error) {
                         geoError = data.reason || 'rate limited';
                    } else {
                         geo = data;
                    }
               }
          } catch (err) {
               geoError = err.name === 'AbortError' ? 'timeout (5s)' : err.message || 'network error';
          } finally {
               clearTimeout(timeoutId);
          }

          const lines = [];
          if (geo) {
               lines.push(row('ip                ', geo.ip || 'unknown'));
               lines.push(
                    row(
                         'location ',
                         [geo.city, geo.region, geo.country_name].filter(Boolean).join(', ') || 'unknown',
                    ),
               );
               lines.push(row('org               ', geo.org || 'unknown'));
               lines.push(row('tz                ', geo.timezone || 'unknown'));
          } else {
               lines.push(
                    `<span style="color:var(--red)">geo lookup failed:</span> <span style="color:var(--dim)">${escapeHtml(geoError || 'unknown')}</span>`,
               );
          }
          lines.push(row('browser     ', `${browser} · ${os}`));
          lines.push(row('lang           ', lang));

          renderBlock(scroll, {
               type: 'tool',
               header: 'whoami',
               durationMs: elapsed,
               bodyHTML: lines.join('\n'),
          });
     },
};

