import { parseInput } from '../shell/parser.js';

function boldify(s) {
     return s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

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

export default async function handleChatFallback(message, { renderBlock, scroll, resume, registry, renderEcho, ...ctx }) {
     const apiKey = localStorage.getItem('gemini_api_key');

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

     const systemPrompt = `You are the AI Persona of Akshansh Kumar, a Senior Software Engineer & Platform Architect at D. E. Shaw. You are chatting with a recruiter or visitor on his personal terminal portfolio site (akshansh.codes). 

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
You can programmatically trigger terminal commands on behalf of the visitor! If they ask to play a game, change the theme, download/view the resume, show help, or clear the screen, you MUST append a special instruction "[EXECUTE: /command_name args]" at the very end of your response text.

Available commands you can trigger:
- To play Snake: Append "[EXECUTE: /snake]"
- To play Chrome Dino: Append "[EXECUTE: /dino]"
- To change colors/theme: Append "[EXECUTE: /theme theme_name]" (Valid theme names: gemini, oled-dark, tokyo-night, dracula, monokai, nord, gemini-light, github-light)
- To print/download/view the full resume: Append "[EXECUTE: /resume]"
- To directly download/print A4 PDF resume: Append "[EXECUTE: /resume --pdf]"
- To list commands: Append "[EXECUTE: /help]"
- To clear the terminal screen: Append "[EXECUTE: /clear]"
- To copy URL sharing link: Append "[EXECUTE: /share]"
- To trigger other easter eggs: "[EXECUTE: /barrel-roll]", "[EXECUTE: /matrix]", "[EXECUTE: /whoami]", "[EXECUTE: /vim]"

Example response:
"I would love to play a game of Snake with you! I'm launching the console game grid below. [EXECUTE: /snake]"`;

     const block = renderBlock(scroll, {
          type: 'tool',
          header: 'chat',
          meta: 'ai',
          bodyText: 'thinking…',
     });
     const bodyCol = block.querySelector('.body-col');

     try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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

          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '(empty reply)';

          // Check if the AI wants to execute a command
          const execMatch = text.match(/\[EXECUTE:\s*([^[\]]+)\]/i);
          let cleanedText = text;
          let commandToRun = null;
          if (execMatch) {
               commandToRun = execMatch[1].trim();
               cleanedText = text.replace(/\[EXECUTE:\s*([^[\]]+)\]/i, '').trim();
          }

          bodyCol.innerHTML = markdownToHtml(cleanedText);

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
          bodyCol.innerHTML = `<span style="color:var(--red)">error calling Gemini API: ${err.message}</span>`;
     }
}
