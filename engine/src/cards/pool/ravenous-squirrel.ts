import { defineCard } from "../define.js";

// EDHREC rank 3072.
const SAC_TEXT = "Whenever you sacrifice an artifact or creature, put a +1/+1 counter on this creature.";
const DRAW_TEXT = "{1}{B}{G}, Sacrifice an artifact or creature: You gain 1 life and draw a card.";

export default defineCard({
  name: "Ravenous Squirrel",
  manaCost: "{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Squirrel"],
  power: 1,
  toughness: 1,
  text: `${SAC_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: {
        mana: "{1}{B}{G}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { typesAnyOf: ["artifact", "creature"] } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
