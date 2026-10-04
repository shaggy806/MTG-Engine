import { defineCard } from "../define.js";
import { ravenous } from "../helpers.js";

// EDHREC rank 5826.
//
// Ravenous is the `ravenous()` helper (Jacked Rabbit). The destroy targets a
// permanent the damaged player controls (Grenzo, Havoc Raiser's
// `whose: "trigger-player"`).

const RAVENOUS = ravenous();
const HAMMER_TEXT =
  "Heavy Power Hammer — Whenever this creature deals combat damage to a player, destroy target artifact or enchantment that player controls.";

export default defineCard({
  name: "Aberrant",
  manaCost: "{X}{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Tyranid", "Mutant"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text:
    "Ravenous (This creature enters with X +1/+1 counters on it. If X is 5 or more, draw a card when it enters.)\nTrample\n" +
    HAMMER_TEXT,
  static: [RAVENOUS.static],
  triggered: [
    RAVENOUS.triggered,
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [
        { kind: "permanent", whose: "trigger-player", filter: { typesAnyOf: ["artifact", "enchantment"] } },
      ],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: HAMMER_TEXT,
    },
  ],
});
