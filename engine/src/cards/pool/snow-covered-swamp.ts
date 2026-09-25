import { defineCard } from "../define.js";

export default defineCard({
  name: "Snow-Covered Swamp",
  colors: [],
  supertypes: ["basic", "snow"],
  types: ["land"],
  subtypes: ["Swamp"],
  text: "({T}: Add {B}.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
  ],
});
