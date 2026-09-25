import { defineCard } from "../define.js";

export default defineCard({
  name: "Timeless Lotus",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: "Timeless Lotus enters tapped.\n{T}: Add {W}{U}{B}{R}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["W", "U", "B", "R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {W}{U}{B}{R}{G}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "Timeless Lotus enters tapped.",
    },
  ],
});
