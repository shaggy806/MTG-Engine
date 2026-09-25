import { defineCard } from "../define.js";

export default defineCard({
  name: "Agent of Stromgald",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 1,
  toughness: 1,
  text: "{R}: Add {B}.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{R}: Add {B}.",
    },
  ],
});
