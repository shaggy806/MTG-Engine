import { defineCard } from "../define.js";

// EDHREC rank 2893.

export default defineCard({
  name: "Chief of the Foundry",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 3,
  text: "Other artifact creatures you control get +1/+1.",
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: "Other artifact creatures you control get +1/+1.",
    },
  ],
});
