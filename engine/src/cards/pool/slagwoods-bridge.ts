import { defineCard } from "../define.js";

export default defineCard({
  name: "Slagwoods Bridge",
  colors: [],
  types: ["artifact", "land"],
  keywords: ["indestructible"],
  text: "This land enters tapped.\nIndestructible\n{T}: Add {R} or {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
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
