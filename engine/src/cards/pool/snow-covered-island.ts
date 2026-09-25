import { defineCard } from "../define.js";

export default defineCard({
  name: "Snow-Covered Island",
  colors: [],
  supertypes: ["basic", "snow"],
  types: ["land"],
  subtypes: ["Island"],
  text: "({T}: Add {U}.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
});
