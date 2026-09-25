import { defineCard } from "../define.js";

export default defineCard({
  name: "Signpost Scarecrow",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\n{2}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{2}: Add one mana of any color.",
    },
  ],
});
