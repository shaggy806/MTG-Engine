import { defineCard } from "../define.js";

// #424 in top-commanders.txt.
const COMBAT_TEXT = "Your opponents can't cast spells during combat.";
const GOAD_TEXT =
  "Whenever a creature you control deals combat damage to a player, goad each creature that player " +
  "controls. (Until your next turn, those creatures attack each combat if able and attack a player " +
  "other than you if able.)";

export default defineCard({
  name: "Marisi, Breaker of the Coil",
  manaCost: "{1}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Warrior"],
  power: 5,
  toughness: 4,
  text: `${COMBAT_TEXT}\n${GOAD_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "turn-structure", duringCombat: true },
      prohibits: { who: "opponents", spells: true },
      text: COMBAT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control" },
      targets: [],
      effect: { kind: "goad", who: "trigger-player" },
      resolve: null,
      text: GOAD_TEXT,
    },
  ],
});
