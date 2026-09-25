import { defineCard } from "../define.js";

export default defineCard({
  name: "Surge Conductor",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Robot"],
  power: 3,
  toughness: 2,
  text: "Whenever another nontoken artifact you control enters, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, type: "artifact" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "Whenever another nontoken artifact you control enters, proliferate.",
    },
  ],
});
