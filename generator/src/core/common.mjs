import fs from 'node:fs';
import { createHash } from 'node:crypto';

export const VERSION = '0.4.5';
export const hash = value => createHash('sha256').update(value).digest('hex');
export const stable = value => JSON.stringify(order(value));
function order(value) {
  return Array.isArray(value) ? value.map(order) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, order(value[key])])) : value;
}
export class GenerationError extends Error {
  constructor(code, message, nextAction, details = {}, cause) {
    super(message, { cause });
    this.name = 'GenerationError';
    Object.assign(this, { code, nextAction, details, exitCode: ['WRITE_FAILED', 'PARTIAL_PRESERVED', 'INTERNAL_ERROR'].includes(code) ? 2 : 1 });
  }
}
export function fail(code, message, nextAction, details, cause) { throw new GenerationError(code, message, nextAction, details, cause); }
export function publicError(error) {
  return error instanceof GenerationError
    ? { code: error.code, message: error.message, nextAction: error.nextAction, details: error.details }
    : { code: 'INTERNAL_ERROR', message: '処理を完了できませんでした。', nextAction: '配布物と出力先を確認し、再試行してください。', details: {} };
}
export function statMaybe(p) {
  try { return fs.lstatSync(p); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export function identity(p) {
  const stat = statMaybe(p);
  return stat?.isDirectory() && !stat.isSymbolicLink() ? `${stat.dev}:${stat.ino}` : null;
}
export function readRegular(p, limit = 10 * 1024 * 1024) {
  const fd = fs.openSync(p, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > limit) throw new Error('A bounded regular file is required');
    return fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
}
