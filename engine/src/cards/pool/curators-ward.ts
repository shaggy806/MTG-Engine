import { defineCard } from "../define.js";

// EDHREC rank 5765.
//
// Rulings:
//   [2018-04-27] If you give hexproof to an opponent’s permanent, such as by enchanting it with
//     Curator’s Ward, that player can still target that permanent, but you can’t.
//   [2018-04-27] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype. Having two of those qualities doesn’t make an
//     object more historic than another or provide an additional bonus—an object either is
//     historic or it isn’t.
//   [2018-04-27] If Curator’s Ward is attached to a historic permanent you don’t control, you draw
//     two cards when that permanent leaves the battlefield, not that permanent’s controller.

export default defineCard({
  name: "Curator's Ward",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant permanent\nEnchanted permanent has hexproof.\nWhen enchanted permanent leaves the battlefield, if it was historic, draw two cards. (Artifacts, legendaries, and Sagas are historic.)",
  targets: ["permanent"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["hexproof"],
      text: "Enchanted permanent has hexproof.",
    },
  ],
  triggered: [
    {
      // "If it was historic" reads the permanent as it last existed on the
      // battlefield, which can't change between the trigger and resolution.
      trigger: {
        on: "leaves-battlefield",
        who: "attached",
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "When enchanted permanent leaves the battlefield, if it was historic, draw two cards.",
    },
  ],
});
