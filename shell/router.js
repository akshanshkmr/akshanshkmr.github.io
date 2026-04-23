const KNOWN_PATHS = new Set([
     'about',
     'projects',
     'skills',
     'experience',
     'contact',
     'resume',
     'help',
]);

const TRANSIENT = new Set([
     'snake',
     'clear',
     'share',
     'sudo',
     'vim',
     'coffee',
     'matrix',
     'ascii',
     'init',
     'whoami',
]);

export function pathToCommand(path) {
     const cleaned = path.replace(/\/+$/, '') || '/';
     if (cleaned === '/') return { name: 'help', args: [] };

     const parts = cleaned.replace(/^\/+/, '').split('/');
     const head = parts[0].toLowerCase();
     if (!KNOWN_PATHS.has(head)) return { name: 'help', args: [] };

     return { name: head, args: parts.slice(1).filter(Boolean) };
}

export function commandToPath({ name, args }) {
     if (TRANSIENT.has(name)) return null;
     if (name === 'help') return '/';
     if (!KNOWN_PATHS.has(name)) return null;
     if (args.length === 0) return `/${name}`;
     return `/${name}/${args.join('/')}`;
}

