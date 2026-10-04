import { defineCard } from "../define.js";

// EDHREC rank 4809.
//
// Rulings:
//   [2022-10-14] If the creature Audacity would enchant is an illegal target by the time the Aura
//     spell resolves, the entire spell doesn't resolve. It's put into your graveyard from the
//     stack, not the battlefield, so its last ability won't trigger.

export default defineCard({
  name: "Audacity",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+0 and has trample. (It can deal excess combat damage to the player or planeswalker it's attacking.)\nWhen this Aura is put into a graveyard from the battlefield, draw a card.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +2/+0 and has trample.",
    },
  ],
  triggered: [
    {
      // Rancor's trigger: only from the battlefield, so a fizzled Aura spell
      // never draws (the ruling).
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this Aura is put into a graveyard from the battlefield, draw a card.",
    },
  ],
});
