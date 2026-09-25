import { defineCard } from "../define.js";

export default defineCard({
  name: "Wirewood Savage",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 2,
  toughness: 2,
  text: "Whenever a Beast enters, you may draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { subtype: "Beast" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever a Beast enters, you may draw a card.",
    },
  ],
});
