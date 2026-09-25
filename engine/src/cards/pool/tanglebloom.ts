import { defineCard } from "../define.js";

export default defineCard({
  name: "Tanglebloom",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}: You gain 1 life.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "{1}, {T}: You gain 1 life.",
    },
  ],
});
