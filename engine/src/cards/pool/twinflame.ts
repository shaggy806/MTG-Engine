import { defineCard } from "../define.js";

// Strive is `costPerExtraTarget`; each copy is its own, of the creature
// it's for.
export default defineCard({
  name: "Twinflame",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Strive — This spell costs {2}{R} more to cast for each target beyond the first.\n" +
    "Choose any number of target creatures you control. For each of them, create a token that's a " +
    "copy of that creature, except it has haste. Exile those tokens at the beginning of the next end step.",
  costPerExtraTarget: "{2}{R}",
  targets: [{ kind: "any-number", of: "creature-you-control" }],
  effect: {
    kind: "for-each-target",
    from: 0,
    effect: { kind: "create-token-copy", of: 0, count: 1, who: "you", gainsHaste: true, exileAtEndStep: true },
  },
});
