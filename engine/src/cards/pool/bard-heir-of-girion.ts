import { defineCard } from "../define.js";

export default defineCard({
  name: "Bard, Heir of Girion",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Archer"],
  power: 4,
  toughness: 4,
  keywords: ["reach", "vigilance"],
  text: "Reach, vigilance\nOther creatures you control get +1/+1.\nWhenever you attack, draw a card.",
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you attack, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control get +1/+1.",
    },
  ],
});
