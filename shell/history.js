export class History {
     constructor() {
          this._entries = [];
          this._cursor = 0;
     }

     push(line) {
          const trimmed = (line ?? '').trim();
          if (trimmed === '') return;
          if (this._entries[this._entries.length - 1] === trimmed) return;
          this._entries.push(trimmed);
          this._cursor = this._entries.length;
     }

     prev() {
          if (this._entries.length === 0) return null;
          if (this._cursor > 0) this._cursor -= 1;
          return this._entries[this._cursor];
     }

     next() {
          if (this._entries.length === 0) return null;
          if (this._cursor < this._entries.length) this._cursor += 1;
          if (this._cursor === this._entries.length) return '';
          return this._entries[this._cursor];
     }
}

