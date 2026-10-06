import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)";
const GRAVE_TEXT = "{2}{B}, Exile this card from your graveyard: You draw a card and you lose 1 life.";

export default defineCard({
  name: "Faerie Dreamthief",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie", "Warlock"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${GRAVE_TEXT}`,
  activated: [
    {
      // `zone: "graveyard"` makes exiling this card the implicit cost.
      cost: { mana: "{2}{B}", tap: false },
      zone: "graveyard",
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: GRAVE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "When this creature enters, surveil 1.",
    },
  ],
});
