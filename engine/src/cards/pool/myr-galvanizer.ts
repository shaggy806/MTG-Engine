import { defineCard } from "../define.js";

// EDHREC rank 6535.

const LORD_TEXT = "Other Myr creatures you control get +1/+1.";
const UNTAP_TEXT = "{1}, {T}: Untap each other Myr you control.";

export default defineCard({
  name: "Myr Galvanizer",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 2,
  toughness: 2,
  text: `${LORD_TEXT}\n${UNTAP_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Myr" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "untap-all", filter: { subtype: "Myr", controlledBy: "you" }, exceptSource: true },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
