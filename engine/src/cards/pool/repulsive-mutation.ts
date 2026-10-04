import { defineCard } from "../define.js";

// EDHREC rank 2791.
//
// Rulings:
//   [2024-02-02] If you control no creatures as Repulsive Mutation is resolving, the amount of mana
//     the target spell's controller must pay to stop their spell from being countered is 0. That
//     player can choose not to pay 0 mana; if they do, the spell will be countered.
// Esper Sentinel's `payGeneric`, fixed as the counter step applies — after
// the counters are on, so they count toward the greatest power. With no
// spell chosen there's no one to ask and nothing to counter.
export default defineCard({
  name: "Repulsive Mutation",
  manaCost: "{X}{G}{U}",
  colors: ["U", "G"],
  types: ["instant"],
  text: "Put X +1/+1 counters on target creature you control. Then counter up to one target spell unless its controller pays mana equal to the greatest power among creatures you control.",
  targets: ["creature-you-control", { kind: "optional", of: "spell" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: "x" },
      {
        kind: "unless",
        chooser: 1,
        options: [
          {
            payGeneric: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
            text: "Pay {X}.",
          },
        ],
        otherwise: { kind: "counter", target: 1 },
      },
    ],
  },
});
