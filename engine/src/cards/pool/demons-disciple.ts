import { defineCard } from "../define.js";

export default defineCard({
  name: "Demon's Disciple",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 1,
  text: "When this creature enters, each player sacrifices a creature or planeswalker of their choice.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "each-player",
        filter: { typesAnyOf: ["creature", "planeswalker"] },
        count: 1,
      },
      resolve: null,
      text: "When this creature enters, each player sacrifices a creature or planeswalker of their choice.",
    },
  ],
});
