import { defineCard } from "../define.js";

export default defineCard({
  name: "Exsanguinate",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each opponent loses X life. You gain life equal to the life lost this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "lose-life", amount: "x", who: "each-opponent" },
      {
        // "The life lost this way": every opponent lost exactly X, so the
        // total is X times the opponents still in the game (Gray Merchant's
        // shape). Exact because nothing in the engine replaces or prevents
        // life *loss*, and an opponent driven to 0 or below is still counted —
        // they only leave the game at the next state-based check, after this
        // has resolved (the 2011-01-01 ruling: 3 and 10 life, X = 4, gain 8).
        kind: "gain-life",
        amount: { product: ["x", { countPlayers: "each-opponent" }] },
      },
    ],
  },
});
