import { defineCard } from "../define.js";

export default defineCard({
  name: "Snow-Covered Forest",
  colors: [],
  supertypes: ["basic", "snow"],
  types: ["land"],
  subtypes: ["Forest"],
  text: "({T}: Add {G}.)",
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
