import { defineCard } from "../define.js";

export default defineCard({
  name: "Maestros Initiate",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Citizen"],
  power: 3,
  toughness: 1,
  text: "{4}{U/R}, Exile this card from your graveyard: Draw two cards, then discard a card.",
  activated: [
    {
      cost: { mana: "{4}{U/R}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{4}{U/R}, Exile this card from your graveyard: Draw two cards, then discard a card.",
      zone: "graveyard",
    },
  ],
});
