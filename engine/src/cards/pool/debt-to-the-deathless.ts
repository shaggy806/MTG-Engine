import { defineCard } from "../define.js";

// EDHREC rank 2545.
//
// Exsanguinate's shape, with "two times X" as a `product`.

export default defineCard({
  name: "Debt to the Deathless",
  manaCost: "{X}{W}{W}{B}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text: "Each opponent loses two times X life. You gain life equal to the life lost this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "lose-life", amount: { product: ["x", 2] }, who: "each-opponent" },
      { kind: "gain-life", amount: { lifeLostThisWay: true, who: "each-opponent" } },
    ],
  },
});
