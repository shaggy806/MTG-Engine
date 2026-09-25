import { defineCard } from "../define.js";

export default defineCard({
  name: "Merfolk Pupil",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, draw a card, then discard a card.\n{1}{U}, Exile this card from your graveyard: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{1}{U}, Exile this card from your graveyard: Draw a card, then discard a card.",
      zone: "graveyard",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "When this creature enters, draw a card, then discard a card.",
    },
  ],
});
