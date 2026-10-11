import { defineCard } from "../define.js";

// EDHREC rank 6738.

const TEXT = "As an additional cost to cast this spell, sacrifice X creatures.\nDestroy X target nonland permanents.";

// Eliminate the Competition's shape: X is announced as it's cast (rule
// 107.3a — with no {X} in its mana cost, X is only this cost's), then
// exactly X targets (an "any number of" group fixed at X), and the X
// creatures to sacrifice are chosen as the cost is paid (rule 601.2h, after
// targets) — so a permanent targeted may be one of them. The X permanents
// are destroyed at once.
export default defineCard({
  name: "Immoral Bargain",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text: TEXT,
  additionalCost: { sacrifice: { type: "creature" }, sacrificeCount: "x" },
  targets: [{ kind: "any-number", of: "nonland-permanent", min: "x", max: "x" }],
  effect: { kind: "for-each-target", from: 0, effect: { kind: "destroy", target: 0 }, simultaneous: true },
});
