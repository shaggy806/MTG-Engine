import { defineCard } from "../define.js";

// EDHREC rank 3514.
//
// Rulings:
//   [2008-05-01] If the enchanted creature is both of the listed colors, it will get both bonuses.
//
// Each clause is its own static on the enchanted creature, gated on the Aura's
// host being that colour as it is now — a creature both white and blue gets both.
const WHITE_TEXT =
  "As long as enchanted creature is white, it gets +1/+1 and has lifelink. (Damage dealt by the creature also causes its controller to gain that much life.)";
const BLUE_TEXT = "As long as enchanted creature is blue, it gets +1/+1 and can't be blocked.";

export default defineCard({
  name: "Steel of the Godhead",
  manaCost: "{2}{W/U}",
  colors: ["W", "U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${WHITE_TEXT}\n${BLUE_TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { attachedTo: { colors: ["W"] } } },
      grantPt: [1, 1],
      grantKeywords: ["lifelink"],
      text: WHITE_TEXT,
    },
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { attachedTo: { colors: ["U"] } } },
      grantPt: [1, 1],
      grantKeywords: ["unblockable"],
      text: BLUE_TEXT,
    },
  ],
});
