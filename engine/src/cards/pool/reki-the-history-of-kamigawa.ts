import { defineCard } from "../define.js";

export default defineCard({
  name: "Reki, the History of Kamigawa",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 2,
  text: "Whenever you cast a legendary spell, draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { supertype: "legendary" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast a legendary spell, draw a card.",
    },
  ],
});
