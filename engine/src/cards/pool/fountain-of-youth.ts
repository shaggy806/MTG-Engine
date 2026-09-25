import { defineCard } from "../define.js";

export default defineCard({
  name: "Fountain of Youth",
  manaCost: "{0}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: You gain 1 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{2}, {T}: You gain 1 life.",
    },
  ],
});
