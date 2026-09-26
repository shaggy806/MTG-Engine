import { defineCard } from "../define.js";

export default defineCard({
  name: "Elesh Norn, Grand Cenobite",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 4,
  toughness: 7,
  keywords: ["vigilance"],
  text: "Vigilance\nOther creatures you control get +2/+2.\nCreatures your opponents control get -2/-2.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [2, 2],
      text: "Other creatures you control get +2/+2.",
    },
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "opponent" } },
      grantPt: [-2, -2],
      text: "Creatures your opponents control get -2/-2.",
    },
  ],
});
