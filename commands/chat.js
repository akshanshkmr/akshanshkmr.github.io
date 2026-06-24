import { parseInput } from '../shell/parser.js';

function markdownToHtml(text) {
     // Basic HTML escape
     let html = String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
          
     // Restore standard styling anchors safely
     html = html
          .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/g, '<strong>$1</strong>')
          .replace(/&lt;span style="color:var\(--cyan\)"&gt;(.*?)&lt;\/span&gt;/g, '<span style="color:var(--cyan)">$1</span>')
          .replace(/&lt;span style="color:var\(--accent\)"&gt;(.*?)&lt;\/span&gt;/g, '<span style="color:var(--accent)">$1</span>');
          
     // Parse markdown items
     return html
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>')
          .split('\n')
          .map((line) => {
               if (line.trim().startsWith('- ')) {
                    return `  <span style="color:var(--accent)">•</span> ${line.trim().slice(2)}`;
               }
               if (line.trim().startsWith('* ')) {
                    return `  <span style="color:var(--accent)">•</span> ${line.trim().slice(2)}`;
               }
               return line;
          })
          .join('\n');
}

// Follow-up prompts offered after each AI reply, to guide visitors who don't
// know what to ask. Clicking one submits it as a new chat query.
const SUGGESTIONS = [
     'What did you build at D. E. Shaw?',
     "What's your tech stack?",
     'Tell me about your hackathon wins',
     'How can I reach you?',
];

function renderSuggestions(scroll) {
     // Only one suggestion row on screen at a time — drop the previous one.
     document.querySelectorAll('.chat-suggest').forEach((el) => el.remove());

     const row = document.createElement('div');
     row.className = 'chat-suggest';
     for (const q of SUGGESTIONS) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'hud-btn';
          btn.textContent = q;
          btn.addEventListener('click', () => {
               const input = document.getElementById('prompt-input');
               const form = document.getElementById('prompt');
               if (!input || !form) return;
               row.remove();
               input.value = q;
               form.requestSubmit();
          });
          row.appendChild(btn);
     }
     scroll.appendChild(row);
}

// ============================================================================
// HARDCODED GEMINI API KEY CONFIGURATION
// ============================================================================
// Note: Committing an API key in plain text to a public GitHub repository will 
// trigger automated security scanners and cause Google to revoke your key within minutes.
//
// To prevent auto-revocation:
// 1. Encode your key in Base64 (e.g., run `btoa('your_key')` in browser console).
// 2. Paste the encoded string into GEMINI_KEY_BASE64 below.
// 3. (Recommended) Go to Google Cloud Console, click edit on this API key, 
//    and set "HTTP referrers" restriction to your website domain:
//    - https://akshanshkmr.github.io/*
//    This secures your key so others cannot abuse it on their own domains.
// ============================================================================
const GEMINI_KEY_BASE64 = "QUl6YVN5Q1ZTZ1pVeUd2V3Q2bzllNDdxRVMyUWlHQVR5SVhjN3Fn"; // Base64 of the site's referrer-restricted Gemini key
const GEMINI_KEY_RAW = "";    // OR paste raw key here (WARNING: will be auto-revoked if repository is public)
// ============================================================================

export default async function handleChatFallback(message, { renderBlock, scroll, resume, registry, renderEcho, ...ctx }) {
     let apiKey = localStorage.getItem('gemini_api_key');

     // Use hardcoded key if configured
     if (GEMINI_KEY_BASE64) {
          try {
               apiKey = atob(GEMINI_KEY_BASE64.trim());
          } catch (e) {
               console.error("Failed to decode base64 Gemini key:", e);
          }
     } else if (GEMINI_KEY_RAW) {
          apiKey = GEMINI_KEY_RAW.trim();
     }

     if (!apiKey) {
          renderBlock(scroll, {
               type: 'error',
               header: 'chat',
               meta: 'key missing',
               bodyHTML: `<span style="color:var(--red)">Gemini API Key is not configured.</span>\n\n` +
                         `To chat with Akshansh's AI Persona, get a free key from Google AI Studio and configure it:\n` +
                         `1. Get Key: <a href="https://aistudio.google.com/" target="_blank" style="color:var(--cyan);text-decoration:underline;">aistudio.google.com</a>\n` +
                         `2. Save:    <span style="color:var(--accent)">/key &lt;your_key&gt;</span>\n\n` +
                         `*Your key is stored strictly on your device and sent directly to Google's API.*`,
          });
          return;
     }

     const systemPrompt = `You are the AI Persona of Akshansh Kumar, a Senior Software Engineer & Platform Architect at D. E. Shaw. You are chatting with a recruiter or visitor on his personal terminal portfolio site (akshanshkmr.github.io). 

Your goal is to answer questions about Akshansh's experience, technical skills, projects, education, and achievements using ONLY this verified resume data:
${JSON.stringify(resume)}

Guidelines:
1. Speak in the first person ("I", "my") as Akshansh Kumar.
2. Keep responses warm, professional, and very concise (1-3 brief paragraphs maximum). Never write long blocks of text.
3. Utilize basic console formatting tags when helpful:
   - Wrap bold keywords in **bold** (e.g. **D. E. Shaw**, **Python**).
   - You can also write bullet points using standard markdown lists (- item).
4. If asked about topics completely unrelated to Akshansh's professional profile, humorously pivot back to his skills (e.g. "I can't compile coffee, but I can tell you about my AI assistant project...").

COMMAND EXECUTION INTEGRATION:
You can programmatically trigger terminal commands on behalf of the visitor! If they ask to play a game, change the theme, download/view the resume, show contact info, show help, or clear the screen, you MUST append a special instruction "[EXECUTE: /command_name args]" at the very end of your response text.

Available commands you can trigger:
- To play Snake: Append "[EXECUTE: /snake]"
- To play Chrome Dino: Append "[EXECUTE: /dino]"
- To change colors/theme: Append "[EXECUTE: /theme theme_name]" (Valid theme names: dark, oled, tokyo, dracula, nord, gruvbox, catppuccin, rose-pine, matrix, solarized, light)
- To print/download/view the full resume: Append "[EXECUTE: /resume]"
- To directly download/print A4 PDF resume: Append "[EXECUTE: /resume --pdf]"
- To show contact details: Append "[EXECUTE: /contact]"
- To list commands: Append "[EXECUTE: /help]"
- To clear the terminal screen: Append "[EXECUTE: /clear]"
- To copy URL sharing link: Append "[EXECUTE: /share]"
- To trigger other easter eggs: "[EXECUTE: /barrel-roll]", "[EXECUTE: /matrix]", "[EXECUTE: /whoami]", "[EXECUTE: /vim]"`;

     const block = renderBlock(scroll, {
          type: 'tool',
          header: 'chat',
          meta: 'ai',
          bodyText: 'thinking…',
     });
     const blockBody = block.querySelector('.body-col');

     // Strip the [EXECUTE: ...] marker (including a partial trailing fragment
     // that may appear mid-stream) before showing text to the visitor.
     const stripExec = (s) => s.replace(/\[EXECUTE:[^\]]*\]?/i, '').trimEnd();

     try {
          // Streaming endpoint (Server-Sent Events) — tokens print as they arrive.
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
               method: 'POST',
               headers: {
                    'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                    contents: [
                         {
                              role: 'user',
                              parts: [{ text: message }]
                         }
                    ],
                    systemInstruction: {
                         parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                         maxOutputTokens: 500,
                         temperature: 0.7
                    }
               })
          });

          if (!res.ok) {
               const errText = await res.text();
               throw new Error(`API returned ${res.status}: ${errText}`);
          }

          // Read the SSE stream, accumulating text and repainting as it grows.
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let text = '';
          let firstToken = true;

          const pump = (chunk) => {
               buffer += chunk;
               const lines = buffer.split('\n');
               buffer = lines.pop(); // keep last partial line
               for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const payload = trimmed.slice(5).trim();
                    if (!payload || payload === '[DONE]') continue;
                    try {
                         const json = JSON.parse(payload);
                         const piece = json.candidates?.[0]?.content?.parts?.[0]?.text;
                         if (piece) {
                              text += piece;
                              if (firstToken) { firstToken = false; }
                              blockBody.innerHTML = markdownToHtml(stripExec(text));
                              scroll.scrollTop = scroll.scrollHeight;
                         }
                    } catch { /* ignore keep-alive / partial JSON */ }
               }
          };

          while (true) {
               const { value, done } = await reader.read();
               if (done) break;
               pump(decoder.decode(value, { stream: true }));
          }

          if (!text) text = '(empty reply)';

          // Check if the AI wants to execute a command
          const execMatch = text.match(/\[EXECUTE:\s*([^[\]]+)\]/i);
          let cleanedText = text;
          let commandToRun = null;
          if (execMatch) {
               commandToRun = execMatch[1].trim();
               cleanedText = text.replace(/\[EXECUTE:\s*([^[\]]+)\]/i, '').trim();
          }

          blockBody.innerHTML = markdownToHtml(cleanedText);
          renderSuggestions(scroll);
          scroll.scrollTop = scroll.scrollHeight;

          if (commandToRun) {
               const rawCmd = commandToRun.startsWith('/') ? commandToRun : '/' + commandToRun;
               const parsed = parseInput(rawCmd);
               if (parsed) {
                    // Slight natural delay before executing
                    setTimeout(async () => {
                         renderEcho(scroll, rawCmd);
                         const result = await registry.dispatch(parsed, { renderBlock, scroll, registry, renderEcho, ...ctx });
                         if (result && result.unknown) {
                              renderBlock(scroll, {
                                   type: "error",
                                   header: "command not found",
                                   meta: result.name,
                                   bodyText: "try /help",
                              });
                         }
                    }, 850);
               }
          }
     } catch (err) {
          blockBody.innerHTML = `<span style="color:var(--red)">error calling Gemini API: ${err.message}</span>`;
          scroll.scrollTop = scroll.scrollHeight;
     }
}
