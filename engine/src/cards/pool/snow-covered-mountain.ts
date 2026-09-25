import { defineCard } from "../define.js";

export default defineCard({
  name: "Snow-Covered Mountain",
  colors: [],
  supertypes: ["basic", "snow"],
  types: ["land"],
  subtypes: ["Mountain"],
  text: "({T}: Add {R}.)",
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
