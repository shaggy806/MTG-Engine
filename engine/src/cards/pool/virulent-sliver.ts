import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 6621.
//
// Rulings:
//   [2013-07-01] If the creature type of a Sliver changes so it's no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.
//   [2021-03-19] Poisonous 1 causes the player to get just one poison counter when a Sliver deals
//     combat damage to them, no matter how much damage that Sliver dealt.
//   [2021-03-19] If a creature has multiple instances of poisonous, each triggers separately.
//
// Poisonous N (rule 702.70a) is a triggered ability: "Whenever this creature
// deals combat damage to a player, that player gets N poison counters." It is
// granted to every Sliver creature, whoever controls it; each Virulent Sliver
// grants its own instance, and each instance triggers separately.

const POISONOUS_TEXT = "Poisonous 1";
const POISONOUS: TriggeredAbility = {
  trigger: { on: "deals-combat-damage-to-player", who: "self" },
  targets: [],
  effect: { kind: "add-player-counters", counter: "poison", amount: 1, who: "trigger-player" },
  resolve: null,
  text: `${POISONOUS_TEXT} (Whenever this creature deals combat damage to a player, that player gets a poison counter.)`,
};
const TEXT =
  "All Sliver creatures have poisonous 1. (Whenever a Sliver deals combat damage to a player, that player gets a poison counter. A player with ten or more poison counters loses the game.)";

export default defineCard({
  name: "Virulent Sliver",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver" } },
      grantsTriggered: [POISONOUS],
      text: TEXT,
    },
  ],
});
