import { defineCard } from "../define.js";

export default defineCard({
  name: "Glasspool Shore",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  faces: ["Glasspool Mimic", "Glasspool Shore"],
});
