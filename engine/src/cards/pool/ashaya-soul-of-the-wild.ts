import { defineCard } from "../define.js";

const PT_TEXT = "Ashaya's power and toughness are each equal to the number of lands you control.";
const FOREST_TEXT =
  "Nontoken creatures you control are Forest lands in addition to their other types. (They're still affected by summoning sickness.)";

// The count reads each permanent's current types, so it takes in the
// creatures the second ability made lands — Ashaya itself among them (the
// ruling). A creature that's a Forest has "{T}: Add {G}" (rule 305.6), which
// its summoning sickness still gates.
export default defineCard({
  name: "Ashaya, Soul of the Wild",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 0,
  text: `${PT_TEXT}\n${FOREST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "land", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", token: false } },
      addTypes: ["land"],
      addSubtypes: ["Forest"],
      text: FOREST_TEXT,
    },
  ],
});
