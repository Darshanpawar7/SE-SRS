// In-memory stand-in for the parts of supabase-js the data service uses.
// Set `client.failWith = 'message'` to make every request fail the way supabase-js
// reports a network or database error (an `error` result, not a thrown exception),
// or `client.hang = true` to make requests never answer, like a stalled connection.
export function createFakeSupabase(tables = {}) {
  const db = { projects: [], sprints: [], tasks: [], activity_logs: [], ...structuredClone(tables) };
  const client = { db, calls: [], failWith: null, hang: false, from };

  function run(op) {
    client.calls.push(op);
    if (client.failWith) return { data: null, error: { message: client.failWith } };
    const rows = db[op.table];
    if (op.kind === 'select') return { data: structuredClone(rows), error: null };
    if (op.kind === 'upsert') {
      for (const row of [].concat(op.payload)) {
        const index = rows.findIndex(existing => existing.id === row.id);
        if (index < 0) rows.push({ ...row });
        else if (!op.options.ignoreDuplicates) rows[index] = { ...rows[index], ...row };
      }
      return { data: null, error: null };
    }
    if (op.kind === 'insert') {
      rows.push(...[].concat(op.payload).map(row => ({ ...row })));
      return { data: null, error: null };
    }
    if (op.kind === 'delete') {
      db[op.table] = rows.filter(row => !op.filters.every(([column, value]) => row[column] === value));
      return { data: null, error: null };
    }
    return { data: null, error: { message: `Unsupported operation: ${op.kind}` } };
  }

  function from(table) {
    const op = { table, kind: 'select', payload: null, options: {}, filters: [] };
    const builder = {
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      eq: (column, value) => { op.filters.push([column, value]); return builder; },
      upsert: (payload, options = {}) => { op.kind = 'upsert'; op.payload = payload; op.options = options; return builder; },
      insert: (payload) => { op.kind = 'insert'; op.payload = payload; return builder; },
      delete: () => { op.kind = 'delete'; return builder; },
      then: (resolve, reject) => (client.hang
        ? new Promise(() => {})
        : Promise.resolve().then(() => run(op)).then(resolve, reject))
    };
    return builder;
  }

  return client;
}
