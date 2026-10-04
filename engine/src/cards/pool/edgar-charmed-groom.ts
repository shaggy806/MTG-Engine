import { defineCard } from "../define.js";

// EDHREC rank 3621.
// Transforms into Edgar Markov's Coffin. Ojer Axonil's shape for the return.
//
// Rulings:
//   [2021-11-19] If a card that isn't a double-faced card is a copy of Edgar, Charmed Groom, it
//     won't return to the battlefield when it dies.

const LORD_TEXT = "Other Vampires you control get +1/+1.";
const DIES_TEXT = "When Edgar dies, return it to the battlefield transformed under its owner's control.";

export default defineCard({
  name: "Edgar, Charmed Groom",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 4,
  toughness: 4,
  text: `${LORD_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Vampire" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source", transformed: true },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  faces: ["Edgar, Charmed Groom", "Edgar Markov's Coffin"],
  transform: true,
});
