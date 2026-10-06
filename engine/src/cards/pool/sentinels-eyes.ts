import { defineCard } from "../define.js";

// EDHREC rank 6466.
//
// Rulings:
//   [2020-01-24] If you cast a spell with its escape permission, you can't choose to apply any
//     other alternative costs or to cast it without paying its mana cost.
//   [2020-01-24] After an escaped spell resolves, it returns to its owner's graveyard if it's not a
//     permanent spell. If it is a permanent spell, it enters the battlefield and will return to its
//     owner's graveyard if it dies later.
const STATIC_TEXT = "Enchanted creature gets +1/+1 and has vigilance.";

export default defineCard({
  name: "Sentinel's Eyes",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    `Enchant creature\n${STATIC_TEXT}\n` +
    "Escape—{W}, Exile two other cards from your graveyard. (You may cast this card from your graveyard for its escape cost.)",
  targets: ["creature"],
  escape: { cost: "{W}", exileCount: 2 },
  static: [
    { affects: { scope: "attached" }, grantPt: [1, 1], grantKeywords: ["vigilance"], text: STATIC_TEXT },
  ],
});
