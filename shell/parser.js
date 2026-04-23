/**
    * Parse a raw input line into { name, args } or null for empty input.
    * Leading slash is optional. Command name is lowercased; args keep case.
    */
export function parseInput(raw) {
     const trimmed = raw.trim();
     if (trimmed === '') return null;

     const stripped = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
     const parts = stripped.split(/\s+/);
     const name = parts[0].toLowerCase();
     const args = parts.slice(1);
     return { name, args };
}

