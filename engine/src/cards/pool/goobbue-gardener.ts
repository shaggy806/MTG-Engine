import { defineCard } from "../define.js";

export default defineCard({
  name: "Goobbue Gardener",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Beast"],
  power: 1,
  toughness: 3,
  text: "{T}: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
  ],
});
