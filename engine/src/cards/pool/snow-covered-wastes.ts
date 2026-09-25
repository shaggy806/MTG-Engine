import { defineCard } from "../define.js";

export default defineCard({
  name: "Snow-Covered Wastes",
  colors: [],
  supertypes: ["basic", "snow"],
  types: ["land"],
  text: "{T}: Add {C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
});
