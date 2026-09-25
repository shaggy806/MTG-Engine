import { defineCard } from "../define.js";

export default defineCard({
  name: "Sisters of the Flame",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{T}: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
  ],
});
