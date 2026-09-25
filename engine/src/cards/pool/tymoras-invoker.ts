import { defineCard } from "../define.js";

export default defineCard({
  name: "Tymora's Invoker",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Orc", "Rogue"],
  power: 1,
  toughness: 3,
  text: "Sleight of Hand — {8}: Draw two cards.",
  activated: [
    {
      cost: { mana: "{8}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "Sleight of Hand — {8}: Draw two cards.",
    },
  ],
});
