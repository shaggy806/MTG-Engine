import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 3281.
//
// Rulings:
//   [2024-11-08] If a creature gains hexproof in response to a spell or ability controlled by an
//     opponent that only targets that creature, then when that spell or ability tries to resolve,
//     all of its targets will be illegal. As a result, that spell or ability won't resolve and
//     none of its effects will happen.
//   [2024-11-08] Attaching Celestial Armor to a creature that has already been blocked won't cause
//     it to become unblocked, even if one or more of the blocking creatures don't have flying or
//     reach.

const ENTER_TEXT =
  "When this Equipment enters, attach it to target creature you control. That creature gains hexproof and indestructible until end of turn.";
const STATIC_TEXT = "Equipped creature gets +2/+0 and has flying.";

export default defineCard({
  name: "Celestial Armor",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["flash"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\n${ENTER_TEXT}\n${STATIC_TEXT}\nEquip {3}{W} ({3}{W}: Attach to target creature you control. Equip only as a sorcery.)`,
  triggered: [
    {
      // Silver Shroud Costume's shape.
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "attach", target: 0, attachment: "source" },
          { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["flying"],
      text: STATIC_TEXT,
    },
  ],
  activated: [equip("{3}{W}")],
});
