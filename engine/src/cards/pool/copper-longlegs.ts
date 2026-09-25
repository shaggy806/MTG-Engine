import { defineCard } from "../define.js";

export default defineCard({
  name: "Copper Longlegs",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Spider"],
  power: 1,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach\n{1}{G}, Sacrifice this creature: Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "{1}{G}, Sacrifice this creature: Proliferate.",
    },
  ],
});
