import { defineCard } from "../define.js";

export default defineCard({
  name: "Whispersilk Cloak",
  manaCost: "{3}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature can't be blocked and has shroud.\nEquip {2}",
  static: [
    {
      affects: { scope: "attached" },
      // "Can't be blocked" is the `unblockable` keyword (evasion, checked in
      // combat); "shroud" is rule 702.18, stronger than hexproof.
      grantKeywords: ["unblockable", "shroud"],
      text: "Equipped creature can't be blocked and has shroud.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {2}",
      sorcerySpeed: true,
    },
  ],
});
