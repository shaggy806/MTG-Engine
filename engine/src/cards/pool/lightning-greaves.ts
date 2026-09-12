import { defineCard } from "../define.js";

// needed-cards P15. New: the "shroud" keyword (rule 702.18) — stronger than
// hexproof, blocking every spell/ability, even its controller's own.
export default defineCard({
  name: "Lightning Greaves",
  manaCost: "{2}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature has haste and shroud. Equip {0}",
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["haste", "shroud"],
      text: "Equipped creature has haste and shroud.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {0}",
      sorcerySpeed: true,
    },
  ],
});
