import { defineCard } from "../define.js";

export default defineCard({
  name: "Tower of Fortunes",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{8}, {T}: Draw four cards.",
  activated: [
    {
      cost: { mana: "{8}", tap: true },
      targets: [],
      effect: { kind: "draw", amount: 4 },
      resolve: null,
      text: "{8}, {T}: Draw four cards.",
    },
  ],
});
