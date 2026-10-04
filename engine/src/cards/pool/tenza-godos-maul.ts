import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 5838.
//
// Hero's Heirloom / Steel of the Godhead's shape: each "as long as" clause is
// its own static on the equipped creature, gated on the host as it is now.

const LEGENDARY_TEXT = "As long as it's legendary, it gets an additional +2/+2.";
const RED_TEXT = "As long as it's red, it has trample.";

export default defineCard({
  name: "Tenza, Godo's Maul",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +1/+1. ${LEGENDARY_TEXT} ${RED_TEXT}\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)`,
  activated: [equip("{1}")],
  static: [
    { affects: { scope: "attached" }, grantPt: [1, 1], text: "Equipped creature gets +1/+1." },
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { attachedTo: { supertype: "legendary" } } },
      grantPt: [2, 2],
      text: LEGENDARY_TEXT,
    },
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { attachedTo: { colors: ["R"] } } },
      grantKeywords: ["trample"],
      text: RED_TEXT,
    },
  ],
});
