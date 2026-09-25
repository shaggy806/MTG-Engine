import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

export default defineCard({
  name: "Hate Mirage",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Choose up to two target creatures you don't control. For each of those creatures, create a token that's a copy of that creature. Those tokens gain haste. Exile them at the beginning of the next end step.",
  // "Up to two" is two optional slots, so each copy keeps a fixed `of:` index,
  // and two different creatures.
  targets: distinctTargets(2, "creature-an-opponent-controls", { optional: true }),
  effect: {
    kind: "sequence",
    effects: [
      // `who: "you"` — the copies are of creatures you *don't* control, and
      // enter under yours.
      {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        gainsHaste: true,
        exileAtEndStep: true,
        who: "you",
      },
      {
        kind: "create-token-copy",
        of: 1,
        count: 1,
        gainsHaste: true,
        exileAtEndStep: true,
        who: "you",
      },
    ],
  },
});
