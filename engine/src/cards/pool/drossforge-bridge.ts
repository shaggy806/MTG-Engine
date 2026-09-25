import { defineCard } from "../define.js";

export default defineCard({
  name: "Drossforge Bridge",
  colors: [],
  types: ["artifact", "land"],
  keywords: ["indestructible"],
  text: "This land enters tapped.\nIndestructible\n{T}: Add {B} or {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "R"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {R}.",
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
