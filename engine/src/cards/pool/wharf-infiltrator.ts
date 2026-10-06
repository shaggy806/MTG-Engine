import { defineCard } from "../define.js";

// Rulings:
//   [2016-07-13] Wharf Infiltrator's last ability triggers anytime you discard a creature card,
//     not just when you discard a card because of Wharf Infiltrator's other triggered ability.
//   [2016-07-13] While resolving Wharf Infiltrator's last ability, you can't pay {2} multiple
//     times to get multiple Eldrazi Horror tokens.
//
// One trigger per creature card discarded (Bone Miser's `perCard` shape), each
// offering {2} once.
const LOOT_TEXT =
  "Whenever this creature deals combat damage to a player, you may draw a card. If you do, discard a card.";
const HORROR_TEXT =
  "Whenever you discard a creature card, you may pay {2}. If you do, create a 3/2 colorless Eldrazi Horror creature token.";

export default defineCard({
  name: "Wharf Infiltrator",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Horror"],
  power: 1,
  toughness: 1,
  keywords: ["skulk"],
  text: `Skulk (This creature can't be blocked by creatures with greater power.)\n${LOOT_TEXT}\n${HORROR_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw a card, then discard a card?",
        effect: { kind: "draw", amount: 1 },
        then: { kind: "discard", target: "you", amount: 1 },
      },
      resolve: null,
      text: LOOT_TEXT,
    },
    {
      trigger: { on: "discards", who: "you", perCard: true, filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {2} to create a 3/2 Eldrazi Horror?",
        cost: "{2}",
        effect: { kind: "create-token", token: "Eldrazi Horror Token", count: 1 },
      },
      resolve: null,
      text: HORROR_TEXT,
    },
  ],
});
