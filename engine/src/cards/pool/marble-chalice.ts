import { defineCard } from "../define.js";

export default defineCard({
  name: "Marble Chalice",
  manaCost: "{2}{W}",
  colors: ["W"],
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
