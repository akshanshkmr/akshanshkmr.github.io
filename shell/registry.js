/**
    * A command handler is `{ name: string, run: async (args, ctx) => any, description?: string }`.
    */
export class Registry {
     constructor() {
          this._handlers = new Map();
     }

     register(handler) {
          if (!handler || !handler.name || typeof handler.run !== 'function') {
               throw new Error('Invalid command handler: must have { name, run }');
          }
          this._handlers.set(handler.name, handler);
     }

     get(name) {
          return this._handlers.get(name);
     }

     list() {
          return [...this._handlers.keys()].sort();
     }

     async dispatch(parsed, ctx) {
          const handler = this._handlers.get(parsed.name);
          if (!handler) return { unknown: true, name: parsed.name };
          return handler.run(parsed.args, ctx);
     }

     completions(prefix) {
          return this.list().filter((n) => n.startsWith(prefix));
     }
}

