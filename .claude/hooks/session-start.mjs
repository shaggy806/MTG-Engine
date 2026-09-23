// SessionStart hook for Claude Code on the web. A remote session starts from a
// bare clone with no node_modules, and `server`/`client` resolve `engine` and
// `protocol` through their built dist/, so until both exist only the engine's
// own tests can run. This installs dependencies and builds everything the
// server needs, so tests, typecheck, lint and the dev servers work at once.
//
// Node rather than bash on purpose: a Windows checkout with core.autocrlf=true
// gives a shell script CRLF line endings, which breaks it, and this file runs
// at the start of local sessions too, where it exits immediately.
import { spawnSync } from "node:child_process";

if (process.env.CLAUDE_CODE_REMOTE !== "true") process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const started = Date.now();

const steps = [
  // `install` rather than `ci`: the container is cached once this hook
  // finishes, and `ci` would throw that node_modules away every session.
  // --no-save keeps it from ever rewriting package-lock.json.
  ["npm", ["install", "--no-save", "--no-audit", "--no-fund"]],
  // Dependency order: protocol imports engine, server imports both.
  ["npm", ["run", "build", "-w", "engine"]],
  ["npm", ["run", "build", "-w", "protocol"]],
  ["npm", ["run", "build", "-w", "server"]],
];

for (const [command, args] of steps) {
  // A SessionStart hook's stdout is added to the session's context, so each
  // command's own output goes to stderr instead.
  const result = spawnSync(command, args, { cwd: root, stdio: ["ignore", 2, 2] });
  if (result.status !== 0) {
    const why = result.error?.message ?? `exit code ${result.status ?? result.signal}`;
    console.error(`session-start: \`${command} ${args.join(" ")}\` failed (${why})`);
    process.exit(1);
  }
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(`Dependencies installed; engine, protocol and server built (${seconds}s).`);
