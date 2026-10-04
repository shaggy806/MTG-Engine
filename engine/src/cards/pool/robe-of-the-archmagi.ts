import { defineCard } from "../define.js";

// EDHREC rank 5108.

// "Equip Shaman, Warlock, or Wizard {1}" is an equip whose target is narrowed
// (Blackblade Reforged's shape): "{1}: Attach to target Shaman, Warlock, or
// Wizard you control. Activate only as a sorcery."
const DRAW_TEXT = "Whenever equipped creature deals combat damage to a player, you draw that many cards.";

export default defineCard({
  name: "Robe of the Archmagi",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${DRAW_TEXT}\nEquip {4}\nEquip Shaman, Warlock, or Wizard {1}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {4}",
      sorcerySpeed: true,
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [
        {
          kind: "permanent",
          whose: "you",
          filter: { type: "creature", subtypes: ["Shaman", "Warlock", "Wizard"] },
        },
      ],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip Shaman, Warlock, or Wizard {1}",
      sorcerySpeed: true,
    },
  ],
});
