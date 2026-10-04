import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 4113.
//
// Rulings:
//   [2020-09-25] If the target creature becomes an illegal target, the Equipment remains on the
//     battlefield unattached.
//   [2020-09-25] Attaching an Equipment with its enters-the-battlefield triggered ability isn't
//     the same as using its equip ability. You don't pay mana for the attachment, and if the
//     Equipment enters at a time you couldn't cast a sorcery, you can still attach it to a
//     creature you control.

const ENTER_TEXT = "When this Equipment enters, attach it to target creature you control.";

export default defineCard({
  name: "Maul of the Skyclaves",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ENTER_TEXT}\nEquipped creature gets +2/+2 and has flying and first strike.\nEquip {2}{W}{W}`,
  activated: [equip("{2}{W}{W}")],
  triggered: [
    {
      // Celestial Armor's shape.
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0, attachment: "source" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["flying", "first-strike"],
      text: "Equipped creature gets +2/+2 and has flying and first strike.",
    },
  ],
});
