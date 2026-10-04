import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 2895.
//
// Rulings:
//   [2025-06-06] Effects that modify the creature's power and/or toughness without setting base
//     power and/or toughness will apply to the creature no matter when they started to take
//     effect. The same is true for counters that change its power and/or toughness and effects
//     that switch its power and toughness.
//   [2025-06-06] Wrecking Ball Arm overwrites all previous effects that set the creature's base
//     power and toughness to specific values. Any power- or toughness-setting effects that start
//     to apply afterward will overwrite this effect.
//   [2025-06-06] Once a creature equipped with Wrecking Ball Arm has been blocked, changing the
//     blocking creature's power to 2 or less won't cause the creature to become unblocked.

const STATIC_TEXT =
  "Equipped creature has base power and toughness 7/7 and can't be blocked by creatures with power 2 or less.";

export default defineCard({
  name: "Wrecking Ball Arm",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\nEquip legendary creature {3}\nEquip {7}`,
  static: [
    {
      affects: { scope: "attached" },
      setBasePt: { power: 7, toughness: 7 },
      cantBeBlockedBy: { power: { op: "lte", n: 2 } },
      text: STATIC_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip legendary creature {3}",
      sorcerySpeed: true,
    },
    equip("{7}"),
  ],
});
