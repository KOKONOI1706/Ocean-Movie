/**
 * One JSON object per line (jobId, type, stage, durationMs, error…), so worker
 * output can be grepped locally and shipped to any log service later.
 * Set LOG_FORMAT=pretty for a readable single line in a terminal.
 */
type Level = 'info' | 'warn' | 'error';

function write(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  const out = level === 'error' ? console.error : console.log;
  if (process.env.LOG_FORMAT === 'pretty') {
    const extras = Object.entries(clean).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' ');
    out(`${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${msg}${extras ? ` ${extras}` : ''}`);
  } else {
    out(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...clean }));
  }
}

export const logger = {
  info: (msg: string, fields?: Record<string, unknown>) => write('info', msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => write('warn', msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => write('error', msg, fields),
};
