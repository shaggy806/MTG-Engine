import { defineCard } from "../define.js";

// EDHREC rank 6295.
// Karametra's Favor's shape; the granted ability's `source` is the creature that has it.
//
// Rulings:
//   [2020-11-10] If the target creature is an illegal target by the time Dragon Mantle tries to
//     resolve, it doesn't resolve. It won't enter the battlefield, so its enters-the-battlefield
//     ability won't trigger.

const PUMP_TEXT = "{R}: This creature gets +1/+0 until end of turn.";

export default defineCard({
  name: "Dragon Mantle",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\nWhen this Aura enters, draw a card.\nEnchanted creature has "${PUMP_TEXT}"`,
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this Aura enters, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [
        {
          cost: { mana: "{R}", tap: false },
          targets: [],
          effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
          resolve: null,
          text: PUMP_TEXT,
        },
      ],
      text: `Enchanted creature has "${PUMP_TEXT}"`,
    },
  ],
});
