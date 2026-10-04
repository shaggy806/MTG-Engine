import { defineCard } from "../define.js";

// The granted trigger is the creature's own: "you" is its controller, and
// "it" is the creature that untapped (the trigger object). Once per turn per
// creature, tracked on that ability of that object.
const GRANTED_TEXT =
  "Whenever this creature becomes untapped, put two +1/+1 counters on it, then you gain 2 life and draw a card. This ability triggers only once each turn.";
const STATIC_TEXT = `Enchanted creature has "${GRANTED_TEXT}"`;

// EDHREC rank 3984.
//
// Rulings:
//   [2024-03-08] If the ability granted by Well Rested triggers in an untap step, it goes onto the
//     stack at the beginning of the next step (usually the upkeep).

export default defineCard({
  name: "Well Rested",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${STATIC_TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantsTriggered: [
        {
          trigger: { on: "becomes-untapped", who: "self" },
          oncePerTurn: true,
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 2 },
              { kind: "gain-life", amount: 2 },
              { kind: "draw", amount: 1 },
            ],
          },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: STATIC_TEXT,
    },
  ],
});
