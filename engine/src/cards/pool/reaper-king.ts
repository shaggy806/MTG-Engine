import { defineCard } from "../define.js";

// Its cost is five twobrid pips ({2/W} is paid with {W} or with two generic
// mana), so a generic cost reduction — Foundry Inspector's, since it's an
// artifact — comes off the {2} half of a pip paid generically, and only then
// (the Spectral Procession ruling; `reduceManaCost`).
export default defineCard({
  name: "Reaper King",
  manaCost: "{2/W}{2/U}{2/B}{2/R}{2/G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 6,
  toughness: 6,
  text:
    "({2/W} can be paid with any two mana or with {W}. This card's mana value is 10.)\n" +
    "Other Scarecrow creatures you control get +1/+1.\n" +
    "Whenever another Scarecrow you control enters, destroy target permanent.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Scarecrow", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other Scarecrow creatures you control get +1/+1.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Scarecrow" },
        otherOnly: true,
      },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "Whenever another Scarecrow you control enters, destroy target permanent.",
    },
  ],
});
