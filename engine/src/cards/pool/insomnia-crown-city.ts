import { defineCard } from "../define.js";

export default defineCard({
  name: "Insomnia, Crown City",
  colors: [],
  types: ["land"],
  subtypes: ["Town"],
  text: "This land enters tapped.\n{T}: Add {W} or {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W} or {B}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
