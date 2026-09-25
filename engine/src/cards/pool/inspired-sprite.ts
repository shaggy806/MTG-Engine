import { defineCard } from "../define.js";

export default defineCard({
  name: "Inspired Sprite",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nWhenever you cast a Wizard spell, you may untap this creature.\n{T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{T}: Draw a card, then discard a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Wizard" } },
      targets: [],
      effect: { kind: "may", prompt: "Untap ~?", effect: { kind: "untap", target: "source" } },
      resolve: null,
      text: "Whenever you cast a Wizard spell, you may untap this creature.",
    },
  ],
});
