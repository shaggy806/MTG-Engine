import { defineCard } from "../define.js";

// EDHREC rank 3601.
//
// Rulings:
//   [2024-03-08] A creature attacks alone if it’s the only creature declared as an attacker during
//     the declare attackers step (including creatures controlled by your teammates, if
//     applicable). For example, the ability granted by Idolized won’t trigger if you attack with
//     multiple creatures and all but one of them are removed from combat. Similarly, creatures
//     that enter the battlefield attacking later in combat won’t be considered when determining
//     whether or not a creature attacked alone.

// The granted trigger is the creature's own, so "you" is the creature's
// controller and X is counted as it resolves.
const GRANTED_TEXT =
  "Whenever this creature attacks alone, it gets +X/+X until end of turn, where X is the number of nonland permanents you control.";
const STATIC_TEXT = `Enchanted creature has "${GRANTED_TEXT}"`;
const NONLAND_YOU_CONTROL = { countOf: { notTypes: ["land"], controlledBy: "you" } } as const;

export default defineCard({
  name: "Idolized",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${STATIC_TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantsTriggered: [
        {
          trigger: { on: "attacks-alone", who: "self" },
          targets: [],
          effect: {
            kind: "modify-pt",
            target: "trigger-object",
            power: NONLAND_YOU_CONTROL,
            toughness: NONLAND_YOU_CONTROL,
            duration: "end-of-turn",
          },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: STATIC_TEXT,
    },
  ],
});
