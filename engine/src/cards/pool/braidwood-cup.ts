import { defineCard } from "../define.js";

export default defineCard({
  name: "Braidwood Cup",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: You gain 1 life.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{T}: You gain 1 life.",
    },
  ],
});
