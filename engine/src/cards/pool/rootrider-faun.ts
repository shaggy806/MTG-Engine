import { defineCard } from "../define.js";

export default defineCard({
  name: "Rootrider Faun",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr", "Scout"],
  power: 1,
  toughness: 3,
  text: "{T}: Add {G}.\n{1}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
  ],
});
