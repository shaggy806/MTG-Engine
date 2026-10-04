import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 4796.
//
// Rulings:
//   [2019-06-14] Damage dealt by the Sliver due to its triggered ability isn’t combat damage, even
//     if it was combat damage that caused that ability to trigger.
//   [2019-06-14] If a Sliver is dealt damage by multiple sources at once (such as by two creatures
//     blocking it), its ability triggers once and one target is dealt that much damage.
//   [2019-06-14] The ability granted by Spiteful Sliver will trigger even if the Sliver is dealt
//     lethal damage. For example, if a 2/2 Sliver blocks a 7/7 creature, the Sliver’s ability will
//     trigger and it will deal 7 damage.

const GRANTED_TEXT = "Whenever this creature is dealt damage, it deals that much damage to target player or planeswalker.";
const TEXT = `Sliver creatures you control have "${GRANTED_TEXT}"`;

// Brash Taunter's shape: `dealt-damage` batches one damage event's damage
// into one trigger (the ruling), and the Sliver holding it deals the damage.
const SPITE: TriggeredAbility = {
  trigger: { on: "dealt-damage", who: "self" },
  targets: ["player-or-planeswalker"],
  effect: { kind: "damage", amount: { triggerValue: true }, target: 0 },
  resolve: null,
  text: GRANTED_TEXT,
};

export default defineCard({
  name: "Spiteful Sliver",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver", controlledBy: "you" } },
      grantsTriggered: [SPITE],
      text: TEXT,
    },
  ],
});
