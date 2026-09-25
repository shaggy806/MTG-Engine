import { defineCard } from "../define.js";

export default defineCard({
  name: "Helionaut",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{1}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
  ],
});
