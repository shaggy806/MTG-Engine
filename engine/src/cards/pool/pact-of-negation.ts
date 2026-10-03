import { defineCard } from "../define.js";

const UPKEEP = "At the beginning of your next upkeep, pay {3}{U}{U}. If you don't, you lose the game.";

// The upkeep payment is a delayed trigger (rule 603.7) set up as the spell
// resolves: a Pact that's countered or loses its target never sets it up, and
// one that resolves but fails to counter (an uncounterable spell) still does
// (the rulings). Paying is the controller's choice, offered when they can.
// Blue by its colour indicator.
export default defineCard({
  name: "Pact of Negation",
  manaCost: "{0}",
  colors: ["U"],
  types: ["instant"],
  text: `Counter target spell.\n${UPKEEP}`,
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      {
        kind: "delayed-trigger",
        at: "your-next-upkeep",
        effect: {
          kind: "unless",
          chooser: "you",
          options: [{ pay: "{3}{U}{U}", text: "Pay {3}{U}{U}." }],
          otherwise: { kind: "lose-game" },
        },
        text: UPKEEP,
      },
    ],
  },
});
