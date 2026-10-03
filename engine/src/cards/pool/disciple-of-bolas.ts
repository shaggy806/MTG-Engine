import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, sacrifice another creature. You gain X life and draw X cards, " +
  "where X is that creature's power.";

// X is the sacrificed creature's power as it last existed on the battlefield
// (the ruling) — the `thisWay` record of the edict, which the ETB's own
// controller answers. With no other creature, nothing is sacrificed and X is
// 0 (the other ruling).
const X = { thisWay: "sacrificed", sumOf: "power" } as const;

export default defineCard({
  name: "Disciple of Bolas",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice", who: "you", filter: { type: "creature" }, count: 1, exceptSource: true },
          { kind: "gain-life", amount: X },
          { kind: "draw", amount: X },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
