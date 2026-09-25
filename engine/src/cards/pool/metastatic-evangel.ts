import { defineCard } from "../define.js";

export default defineCard({
  name: "Metastatic Evangel",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Human", "Cleric"],
  power: 3,
  toughness: 1,
  text: "Whenever another nontoken creature you control enters, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Whenever another nontoken creature you control enters, proliferate.",
    },
  ],
});
