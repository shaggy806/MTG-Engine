import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 5511.

const GRANTED_TEXT = "When this creature enters, it deals 1 damage to target player or planeswalker and you gain 1 life.";
const TEXT = `Sliver creatures you control have "${GRANTED_TEXT}"`;

// Harmonic Sliver's granted enters trigger, scoped as Spiteful Sliver's grant
// is (Sliver creatures you control): it grants itself the ability, and the
// Sliver that enters deals the damage.
const ENTERS: TriggeredAbility = {
  trigger: { on: "enters-battlefield", who: "self" },
  targets: ["player-or-planeswalker"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", target: 0, amount: 1 },
      { kind: "gain-life", amount: 1 },
    ],
  },
  resolve: null,
  text: GRANTED_TEXT,
};

export default defineCard({
  name: "Lavabelly Sliver",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver", controlledBy: "you" } },
      grantsTriggered: [ENTERS],
      text: TEXT,
    },
  ],
});
