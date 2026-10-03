import { defineCard } from "../define.js";

const TEXT = "As an additional cost to cast this spell, sacrifice X creatures.\nDestroy X target creatures.";

// X is announced as it's cast (rule 107.3a), then exactly X targets (an "any
// number of" group fixed at X), and the X creatures to sacrifice are chosen
// as the cost is paid — so a creature targeted may be one of them. Cast
// without paying its mana cost, X is still chosen and still sacrificed (the
// ruling): the sacrifice is no part of the mana cost.
export default defineCard({
  name: "Eliminate the Competition",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: TEXT,
  additionalCost: { sacrifice: { type: "creature" }, sacrificeCount: "x" },
  targets: [{ kind: "any-number", of: "creature", min: "x", max: "x" }],
  effect: { kind: "for-each-target", from: 0, effect: { kind: "destroy", target: 0 }, simultaneous: true },
});
