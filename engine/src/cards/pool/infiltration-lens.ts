import { defineCard } from "../define.js";

// EDHREC rank 3756.
//
// Rulings:
//   [2011-01-01] If the equipped creature becomes blocked by multiple creatures, Infiltration
//     Lens's ability triggers that many times.
//
// `blocked-by` fires once per blocker (flanking's shape), which is the ruling;
// `who: "attached"` is the equipped creature.
const TRIGGER_TEXT = "Whenever equipped creature becomes blocked by a creature, you may draw two cards.";

export default defineCard({
  name: "Infiltration Lens",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TRIGGER_TEXT}\nEquip {1}`,
  triggered: [
    {
      trigger: { on: "blocked-by", who: "attached" },
      targets: [],
      effect: { kind: "may", prompt: "Draw two cards?", effect: { kind: "draw", amount: 2 } },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {1}",
      sorcerySpeed: true,
    },
  ],
});
