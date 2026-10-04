import { defineCard } from "../define.js";

// EDHREC rank 5101.
//
// Rulings:
//   [2023-05-12] If you cast a spell from your graveyard using another permission, Danitha's
//     effect doesn't apply. You can cast another Aura or Equipment spell from your graveyard.
//   [2023-05-12] You must pay the costs to cast that spell. If it has an alternative cost, you may
//     cast it for that cost instead.
//   [2023-05-12] You must follow the normal timing permissions and restrictions of the spell you
//     cast from your graveyard.
//   [2023-05-12] If you cast one Aura or Equipment spell from your graveyard and then have a new
//     Danitha come under your control in the same turn, you may cast another Aura or Equipment
//     spell from your graveyard that turn.
//   [2023-05-12] Once you begin to cast the spell, losing control of Danitha won't affect the
//     spell.
//
// Karador, Ghost Chieftain's permission, over Auras and Equipment.
const CAST_TEXT = "Once during each of your turns, you may cast an Aura or Equipment spell from your graveyard.";

export default defineCard({
  name: "Danitha, New Benalia's Light",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance", "trample", "lifelink"],
  text: `Vigilance, trample, lifelink\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castFromGraveyard: { filter: { subtypes: ["Aura", "Equipment"] }, oncePerTurn: true, yourTurnOnly: true },
      text: CAST_TEXT,
    },
  ],
});
