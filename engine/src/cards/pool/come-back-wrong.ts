import { defineCard } from "../define.js";

const TEXT =
  "Destroy target creature. If a creature card is put into a graveyard this way, return it to the battlefield " +
  "under your control. Sacrifice it at the beginning of your next end step.";

// "A creature card put into a graveyard this way" is the destroyed creature
// gone to its owner's graveyard (`thisWay: "died"`, any player's) — not a
// token, nor one that regenerated or went to exile instead. "Sacrifice it" is
// yours to do (rule 701.21a): if someone else has taken it by then, it stays.
export default defineCard({
  name: "Come Back Wrong",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: TEXT,
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "look-and-choose",
        zone: "graveyards",
        min: 1,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature", token: false, thisWay: "died" },
        then: {
          kind: "delayed-trigger",
          at: "your-next-end-step",
          effect: { kind: "sacrifice-target", target: 0 },
          text: "Sacrifice the creature Come Back Wrong returned to the battlefield.",
        },
      },
    ],
  },
});
