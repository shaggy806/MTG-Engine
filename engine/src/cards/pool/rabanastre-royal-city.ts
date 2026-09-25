import { defineCard } from "../define.js";

export default defineCard({
  name: "Rabanastre, Royal City",
  colors: [],
  types: ["land"],
  subtypes: ["Town"],
  text: "This land enters tapped.\n{T}: Add {R} or {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {W}.",
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
