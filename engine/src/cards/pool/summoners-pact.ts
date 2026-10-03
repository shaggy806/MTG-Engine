import { defineCard } from "../define.js";

const SEARCH = "Search your library for a green creature card, reveal it, put it into your hand, then shuffle.";
const UPKEEP = "At the beginning of your next upkeep, pay {2}{G}{G}. If you don't, you lose the game.";

// The upkeep payment is a delayed trigger (rule 603.7) set up as the spell
// resolves — a countered Pact never sets it up (the ruling). Paying is the
// controller's choice, offered when they can. Green by its colour indicator.
export default defineCard({
  name: "Summoner's Pact",
  manaCost: "{0}",
  colors: ["G"],
  types: ["instant"],
  text: `${SEARCH}\n${UPKEEP}`,
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "search-library",
        filter: { type: "creature", colors: ["G"] },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      {
        kind: "delayed-trigger",
        at: "your-next-upkeep",
        effect: {
          kind: "unless",
          chooser: "you",
          options: [{ pay: "{2}{G}{G}", text: "Pay {2}{G}{G}." }],
          otherwise: { kind: "lose-game" },
        },
        text: UPKEEP,
      },
    ],
  },
});
