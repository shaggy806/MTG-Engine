import { defineCard } from "../define.js";

export default defineCard({
  name: "Furtive Analyst",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\n{2}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{2}, {T}: Draw a card, then discard a card.",
    },
  ],
});
