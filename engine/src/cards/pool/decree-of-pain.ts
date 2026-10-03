import { defineCard } from "../define.js";

const TEXT =
  "Destroy all creatures. They can't be regenerated. Draw a card for each creature destroyed this way.";
const CYCLE_TEXT = "When you cycle this card, all creatures get -2/-2 until end of turn.";

// "Destroyed this way": an indestructible creature wasn't, and draws
// nothing. The cycle trigger goes on the stack above the cycling ability and
// resolves before its draw (the ruling).
export default defineCard({
  name: "Decree of Pain",
  manaCost: "{6}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  cycling: { cost: "{3}{B}{B}" },
  text: `${TEXT}\nCycling {3}{B}{B} ({3}{B}{B}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" }, cantBeRegenerated: true },
      { kind: "draw", amount: { thisWay: "destroyed" } },
    ],
  },
  triggered: [
    {
      trigger: { on: "this-cycled" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature" },
        power: -2,
        toughness: -2,
        duration: "end-of-turn",
      },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
