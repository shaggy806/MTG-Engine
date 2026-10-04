import { defineCard } from "../define.js";

// EDHREC rank 3557.
//
// Rulings:
//   [2023-11-10] Bedrock Tortoise's ability doesn't actually change any creature's power. It
//     changes only the amount of combat damage the creature assigns. All other rules and effects
//     that check power or toughness use the real values, even if they cause damage "equal to a
//     creature's power" to be dealt.

const HEXPROOF_TEXT = "During your turn, creatures you control have hexproof.";
const DAMAGE_TEXT =
  "Each creature you control with toughness greater than its power assigns combat damage equal to its toughness rather than its power.";

export default defineCard({
  name: "Bedrock Tortoise",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Turtle"],
  power: 0,
  toughness: 6,
  text: `${HEXPROOF_TEXT}\n${DAMAGE_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      condition: { kind: "your-turn" },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
    {
      // Ancient Lumberknot's form, over your creatures only.
      affects: { scope: "creatures-you-control" },
      combatDamageByToughness: "if-toughness-greater",
      text: DAMAGE_TEXT,
    },
  ],
});
