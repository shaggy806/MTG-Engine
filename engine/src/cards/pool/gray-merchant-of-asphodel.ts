import { defineCard } from "../define.js";

export default defineCard({
  name: "Gray Merchant of Asphodel",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 4,
  text:
    "When Gray Merchant of Asphodel enters, each opponent loses X life, where X " +
    "is your devotion to black. You gain life equal to the life lost this way.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "lose-life",
            amount: { devotionTo: "B" },
            who: "each-opponent",
          },
          {
            // "Life lost this way" — each opponent lost your devotion, so the
            // total is that times however many opponents are left. Exact
            // today: nothing in this engine replaces or prevents *life loss*
            // (prevention shields are damage-only), so no opponent can lose
            // less than the full amount.
            kind: "gain-life",
            amount: {
              product: [{ devotionTo: "B" }, { countPlayers: "each-opponent" }],
            },
          },
        ],
      },
      resolve: null,
      text:
        "When Gray Merchant of Asphodel enters, each opponent loses X life, where X " +
        "is your devotion to black. You gain life equal to the life lost this way.",
    },
  ],
});
