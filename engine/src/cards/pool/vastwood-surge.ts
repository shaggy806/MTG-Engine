import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 5046.
//
// Rulings:
//   [2020-09-25] If any abilities trigger when the lands are put onto the battlefield and Vastwood
//     Surge was kicked, those abilities won't resolve until after you've put two +1/+1 counters on
//     creatures you control.
//   [2024-11-08] If you put a permanent with a kicker ability onto the battlefield without casting
//     it, you can't kick it.
//   [2024-11-08] To determine a spell's total cost, start with the mana cost (or an alternative
//     cost if another card's effect allows you to pay one instead), add any cost increases (such
//     as kicker), then apply any cost reductions. The spell's mana value remains unchanged, no
//     matter what the total cost to cast it was.
//   [2024-11-08] If a spell's kicker cost was paid, the spell is "kicked."
//   [2024-11-08] The kicker ability doesn't let you pay a kicker cost more than once.
//   [2024-11-08] If a card or token enters as a copy of a permanent, the new permanent isn't
//     kicked, even if the original was.
//   [2024-11-08] If you copy a kicked spell on the stack, the copy is also kicked. If the copied
//     spell is a permanent spell, the token the copy of that spell becomes when it enters is also
//     kicked.

// Kicked, the same search and then the counters (Aang's Journey's kicker
// shape: `kicker.effect` replaces the base effect). The lands are on the
// battlefield before the counters go on, so a land that's a creature gets them.
const SEARCH: EffectSpec = {
  kind: "search-library",
  filter: { supertype: "basic", type: "land" },
  destination: "battlefield",
  min: 0,
  max: 2,
  enterTapped: true,
};

export default defineCard({
  name: "Vastwood Surge",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Kicker {4} (You may pay an additional {4} as you cast this spell.)\nSearch your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle. If this spell was kicked, put two +1/+1 counters on each creature you control.",
  effect: SEARCH,
  kicker: {
    cost: "{4}",
    effect: {
      kind: "sequence",
      effects: [
        SEARCH,
        { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 2 },
      ],
    },
  },
});
