import { defineCard } from "../define.js";

// Rulings:
//   [2022-06-10] A "commander you control" means a permanent on the battlefield that is a
//     commander and is under your control. It can be your commander or one owned by another
//     player. It doesn't refer to your commander in any other zone.

const TEXT =
  "Counter target spell. If that spell targets a commander you control, instead counter that spell, scry 2, then draw a card.";

// The spell's targets are read as this resolves (Rebuff the Wicked's
// `targets` clause): a commander permanent you control that it still
// targets — one that has left since is a new object it doesn't target.
export default defineCard({
  name: "Bane's Contingency",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: TEXT,
  targets: ["spell"],
  effect: {
    kind: "conditional",
    condition: {
      kind: "target",
      index: 0,
      filter: { targets: { permanent: { isCommander: true, controlledBy: "you" } } },
    },
    then: {
      kind: "sequence",
      effects: [
        { kind: "counter", target: 0 },
        { kind: "scry", amount: 2 },
        { kind: "draw", amount: 1 },
      ],
    },
    else: { kind: "counter", target: 0 },
  },
});
