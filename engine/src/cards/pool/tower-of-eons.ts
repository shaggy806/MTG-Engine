import { defineCard } from "../define.js";

export default defineCard({
  name: "Tower of Eons",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{8}, {T}: You gain 10 life.",
  activated: [
    {
      cost: { mana: "{8}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 10 },
      resolve: null,
      text: "{8}, {T}: You gain 10 life.",
    },
  ],
});
