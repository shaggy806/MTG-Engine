import { defineCard } from "../define.js";

export default defineCard({
  name: "Jarvis, Earth's Mightiest Butler",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 1,
  toughness: 4,
  text: "Whenever you cast a Hero spell, draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Hero" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast a Hero spell, draw a card.",
    },
  ],
});
