// The captures from live games (`captures/`, see `captures.mjs`): which are
// open, which resolved, and whether the bot gets each right today.
//
//   npm run bot:captures -w engine
//       every capture, open then resolved: what the shipped v2 chooses there
//       now (right / WRONG), the tester's note, and for a resolved one when,
//       at which commit and how.
//   npm run bot:captures -w engine -- resolve <file or name part> --note "what fixed it"
//       re-asks v2; if it's right, stamps `resolved` ({ at, commit, note })
//       and moves the file to `captures/resolved/`, where it gates
//       (`bot:scenarios`, `bot:fit-scenarios`). Refused while it's still
//       wrong, unless --force.
//   npm run bot:captures -w engine -- reopen <file or name part>
//       moves a resolved capture back to open, dropping its record.
//
// Runs `dist/`: build first.

import { execSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

import {
  DEFAULT_WEIGHTS,
  EvalBotController,
  createDefaultRegistry,
  runScenarios,
  scenarioFromCapture,
} from "../dist/index.js";
import { CAPTURE_DIR, RESOLVED_DIR, readCaptures } from "./captures.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const command = args[0] !== undefined && !args[0].startsWith("--") ? args[0] : "list";
const registry = createDefaultRegistry();
const makeBot = (player, reg, weights) => new EvalBotController(player, reg, { weights });

/** v2's answer to `capture` today, as `{ passed, detail }`. */
function ask(capture) {
  const open = { ...capture, resolved: undefined };
  return runScenarios(DEFAULT_WEIGHTS, registry, makeBot, [scenarioFromCapture(open)])[0];
}

function find(query, dir) {
  if (query === undefined) throw new Error("name a capture: its file name, or part of it or of its name");
  const all = readCaptures(dir);
  const hits = all.filter(({ file, capture }) => file.includes(query) || capture.name.includes(query));
  if (hits.length !== 1) {
    throw new Error(
      `${hits.length === 0 ? "no" : "more than one"} capture matches "${query}" in ${dir}` +
        (hits.length > 1 ? `: ${hits.map((h) => h.file).join(", ")}` : ""),
    );
  }
  return hits[0];
}

const write = (path, capture) => writeFileSync(path, `${JSON.stringify(capture)}\n`);

if (command === "list") {
  const sections = [
    ["open (training)", readCaptures(CAPTURE_DIR)],
    ["resolved (gate)", readCaptures(RESOLVED_DIR)],
  ];
  for (const [title, entries] of sections) {
    console.log(`${title}: ${entries.length}`);
    for (const { file, capture } of entries) {
      const now = ask(capture);
      console.log(`  ${now.passed ? "right" : "WRONG"}  ${capture.name}`);
      console.log(`         ${file}`);
      if (capture.note !== "") console.log(`         note: ${capture.note}`);
      console.log(`         now: ${now.detail}`);
      // What the live bot's search said as it made the move (`diagnosis`).
      const d = capture.diagnosis;
      if (d !== undefined) {
        const top = d.scores.slice(0, 4).map((x) => `${x.move} ${x.score ?? "failed"}`).join("; ");
        console.log(`         live: ${d.via}, ${d.simulations} simulations in ${d.ms} ms${d.expired ? ", clock ran out" : ""}${top ? ` — ${top}` : ""}`);
      }
      const r = capture.resolved;
      if (r !== undefined) console.log(`         resolved ${r.at.slice(0, 10)} at ${r.commit}: ${r.note}`);
    }
  }
} else if (command === "resolve") {
  const { file, path, capture } = find(args[1], CAPTURE_DIR);
  const now = ask(capture);
  if (!now.passed && !args.includes("--force")) {
    console.error(`still wrong — ${now.detail}. Fix the bot first, or pass --force.`);
    process.exit(1);
  }
  const note = flag("note") ?? "";
  if (note === "") console.warn("no --note: say what fixed it, for whoever reads this later");
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  mkdirSync(RESOLVED_DIR, { recursive: true });
  write(path, { ...capture, resolved: { at: new Date().toISOString(), commit, note } });
  renameSync(path, RESOLVED_DIR + file);
  console.log(`resolved: ${capture.name} (${now.detail}) -> captures/resolved/${file}`);
} else if (command === "reopen") {
  const { file, path, capture } = find(args[1], RESOLVED_DIR);
  const { resolved: _dropped, ...open } = capture;
  write(path, open);
  renameSync(path, CAPTURE_DIR + file);
  console.log(`reopened: ${capture.name} -> captures/${file}`);
} else {
  console.error(`unknown command "${command}": list, resolve or reopen`);
  process.exit(1);
}
