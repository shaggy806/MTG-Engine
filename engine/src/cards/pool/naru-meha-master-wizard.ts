import { defineCard } from "../define.js";

// EDHREC rank 6224.
//
// Rulings: the copy keeps X, mode and divided damage; it isn't cast; any
// instant or sorcery spell you control, with or without targets.
//
// Dualcaster Mage's copy, aimed at a spell you control (Increasing
// Vengeance's target), plus Anowon's "Other Rogues" lord shape.
const ETB_TEXT =
  "When Naru Meha enters, copy target instant or sorcery spell you control. You may choose new targets for the copy.";
const LORD_TEXT = "Other Wizards you control get +1/+1.";

export default defineCard({
  name: "Naru Meha, Master Wizard",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flash"],
  text: `Flash\n${ETB_TEXT}\n${LORD_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "spell", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: { kind: "copy-spell", target: 0, newTargets: true },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Wizard" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
});
