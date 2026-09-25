import { defineCard } from "../define.js";

export default defineCard({
  name: "Snow-Covered Plains",
  colors: [],
  supertypes: ["basic", "snow"],
  types: ["land"],
  subtypes: ["Plains"],
  text: "({T}: Add {W}.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
  ],
});
