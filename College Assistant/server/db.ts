/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real persistence for app state — a plain JSON file on disk, not a real
 * SQL database. This started as SQLite (better-sqlite3), but that requires
 * compiling native code at install time (Visual Studio Build Tools on
 * Windows, Xcode Command Line Tools on Mac), which fails on machines that
 * don't have those installed — exactly the kind of setup friction this app
 * should avoid. Since the actual need here is just "save a few JSON blobs
 * durably and read them back", a plain file accomplishes that with zero
 * native dependencies and works identically on every platform.
 *
 * Same `saveState`/`loadState` API as before, so nothing else in the
 * codebase needs to know this changed.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'app-state.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readAll(): Record<string, unknown> {
  if (!fs.existsSync(STATE_FILE)) return {};
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('[db] Failed to read state file, starting fresh:', err);
    return {};
  }
}

// Debounced writes so rapid successive saves (e.g. every keystroke-driven
// state change) don't hammer the disk with a full rewrite each time.
let pendingWrite: NodeJS.Timeout | null = null;
let cache: Record<string, unknown> = readAll();

function flush() {
  try {
    // Write to a temp file then rename — avoids ever leaving a
    // half-written, corrupt JSON file if the process dies mid-write.
    const tmpFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(cache, null, 2), 'utf-8');
    fs.renameSync(tmpFile, STATE_FILE);
  } catch (err) {
    console.error('[db] Failed to write state file:', err);
  }
}

export function saveState<T>(key: string, value: T): void {
  cache[key] = value;
  if (pendingWrite) clearTimeout(pendingWrite);
  pendingWrite = setTimeout(flush, 200);
}

export function loadState<T>(key: string, fallback: T): T {
  return (key in cache ? (cache[key] as T) : fallback);
}

// Make sure the last write actually lands on disk even on a clean shutdown.
process.on('SIGINT', () => { flush(); process.exit(0); });
process.on('SIGTERM', () => { flush(); process.exit(0); });
