import { defineCard } from "../define.js";

const TEXT =
  "Sacrifice a creature. When you do, all creatures get -X/-X until end of turn, " +
  "where X is the sacrificed creature's toughness.";

// The sacrifice is chosen as the spell resolves, and doing it triggers a
// reflexive ability players can respond to knowing X (the rulings) — X is
// the sacrificed creature's toughness as it last existed on the battlefield,
// read by the spell and carried as the ability's trigger value. With no
// creature to sacrifice, nothing triggers.
const MINUS_X = { product: [{ triggerValue: true }, -1] } as const;

export default defineCard({
  name: "Tip the Scales",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "you", filter: { type: "creature" }, count: 1 },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "sacrificed" },
        then: {
          kind: "reflexive-trigger",
          targets: [],
          value: { thisWay: "sacrificed", sumOf: "toughness" },
          effect: {
            kind: "modify-pt-all",
            filter: { type: "creature" },
            power: MINUS_X,
            toughness: MINUS_X,
            duration: "end-of-turn",
          },
          text: "When you do, all creatures get -X/-X until end of turn, where X is the sacrificed creature's toughness.",
        },
      },
    ],
  },
});
