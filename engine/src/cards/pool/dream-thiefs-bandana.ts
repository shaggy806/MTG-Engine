import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 6437.
//
// Rulings:
//   [2024-04-12] You may look at and play cards exiled face down with Dream-Thief's Bandana's
//     first ability (and spend mana of any type to do so) even if Dream-Thief's Bandana and/or
//     the equipped creature leaves the battlefield. If another player gains control of
//     Dream-Thief's Bandana and/or the equipped creature, that player can't look at or play cards
//     already exiled with Dream-Thief's Bandana, and you still can.
//   [2024-04-12] Playing an exiled card causes it to leave exile. You can't play it multiple
//     times.
//
// Gonti, Canny Acquisitor's exile on Rogue's Gloves' trigger: "their library"
// is the player dealt the damage, and the permission is the resolving
// player's, for as long as the card stays exiled.
const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, look at the top card of their library, then exile it face down. For as long as it remains exiled, you may play it, and mana of any type can be spent to cast that spell.";

export default defineCard({
  name: "Dream-Thief's Bandana",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${DAMAGE_TEXT}\nEquip {1}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        whose: "trigger-player",
        duration: "while-exiled",
        faceDown: true,
        spendAs: "any-type",
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{1}")],
});
