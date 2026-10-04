import { defineCard } from "../define.js";

// EDHREC rank 4528.
//
// Rulings:
//   [2008-05-01] If the enchanted creature is both of the listed colors, it will get both bonuses.
//   [2008-05-01] If an effect would simultaneously destroy Shield of the Oversoul and a green
//     creature it's enchanting, only the Shield is destroyed.
//   [2013-07-01] If a green creature enchanted by Shield of the Oversoul is dealt lethal damage,
//     the creature isn't destroyed, but the damage remains on the creature. If Shield of the
//     Oversoul stops enchanting that creature later in the turn, the creature will lose
//     indestructible and will be destroyed.
//
// Steel of the Godhead's shape: each clause is its own static on the enchanted
// creature, gated on the host being that colour as it is now.
const GREEN_TEXT =
  "As long as enchanted creature is green, it gets +1/+1 and has indestructible. (Damage and effects that say \"destroy\" don't destroy it. If its toughness is 0 or less, it still dies.)";
const WHITE_TEXT = "As long as enchanted creature is white, it gets +1/+1 and has flying.";

export default defineCard({
  name: "Shield of the Oversoul",
  manaCost: "{2}{G/W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${GREEN_TEXT}\n${WHITE_TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { attachedTo: { colors: ["G"] } } },
      grantPt: [1, 1],
      grantKeywords: ["indestructible"],
      text: GREEN_TEXT,
    },
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { attachedTo: { colors: ["W"] } } },
      grantPt: [1, 1],
      grantKeywords: ["flying"],
      text: WHITE_TEXT,
    },
  ],
});
