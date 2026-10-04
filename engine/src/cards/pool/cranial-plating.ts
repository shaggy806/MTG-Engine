import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 2448.
//
// Rulings:
//   [2021-03-19] Cranial Plating is counted by its own ability, so it gives at least +1/+0.
//   [2021-03-19] Cranial Plating's first activated ability is similar to an equip ability, but
//     it's not an equip ability. Most importantly, it can be activated any time you could cast an
//     instant, even during another player's turn.
//
// The pump is Adaptive Omnitool's `grantPtPerCount` (the Plating is an
// artifact you control, so it counts itself). The {B}{B} ability is equip's
// shape without `sorcerySpeed`: instant speed, and not an equip ability.
const PUMP_TEXT = "Equipped creature gets +1/+0 for each artifact you control.";
const ATTACH_TEXT = "{B}{B}: Attach this Equipment to target creature you control.";

export default defineCard({
  name: "Cranial Plating",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${PUMP_TEXT}\n${ATTACH_TEXT}\nEquip {1}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "artifact", controlledBy: "you" }, pt: [1, 0] },
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{B}{B}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: ATTACH_TEXT,
    },
    equip("{1}"),
  ],
});
