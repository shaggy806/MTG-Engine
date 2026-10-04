import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 3977.

export default defineCard({
  name: "Hero's Heirloom",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +2/+1.\nAs long as equipped creature is legendary, it has trample and haste.\nEquip {2}",
  activated: [equip("{2}")],
  // The second static is gated on the Equipment's host being legendary as it
  // is now (Steel of the Godhead's shape).
  static: [
    { affects: { scope: "attached" }, grantPt: [2, 1], text: "Equipped creature gets +2/+1." },
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { attachedTo: { supertype: "legendary" } } },
      grantKeywords: ["trample", "haste"],
      text: "As long as equipped creature is legendary, it has trample and haste.",
    },
  ],
});
