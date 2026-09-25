import { defineCard } from "../define.js";

export default defineCard({
  name: "Elixir of Vitality",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "This artifact enters tapped.\n{T}, Sacrifice this artifact: You gain 4 life.\n{8}, {T}, Sacrifice this artifact: You gain 8 life.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "{T}, Sacrifice this artifact: You gain 4 life.",
    },
    {
      cost: { mana: "{8}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 8 },
      resolve: null,
      text: "{8}, {T}, Sacrifice this artifact: You gain 8 life.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
    },
  ],
});
