import { defineCard } from "../define.js";

// EDHREC rank 2607.
// Adventure: Ardenvale Fealty (ardenvale-fealty.ts) makes a "Knight Token".
//
// Rulings (the adventure ones, abridged):
//   [2023-09-01] If a spell is cast as an Adventure, its controller exiles it instead of putting
//     it into its owner's graveyard as it resolves. For as long as it remains exiled, that player
//     may cast it as a permanent spell. If an Adventure spell leaves the stack in any way other
//     than resolving, that card won't be exiled and the spell's controller won't be able to cast
//     it as a permanent later.

const TEXT =
  "At the beginning of your end step, put a +1/+1 counter on each creature you control. Untap those creatures.";

export default defineCard({
  name: "Virtue of Loyalty",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      // "Those creatures" are the creatures you control as it resolves: the
      // two steps run back to back over the same filter, nothing in between.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
          { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Virtue of Loyalty", "Ardenvale Fealty"],
  adventure: true,
});
