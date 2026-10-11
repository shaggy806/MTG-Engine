import { defineCard } from "../define.js";

// EDHREC rank 6712. Blight Mound's static over every creature: the bonus and
// menace apply only while a creature you control is attacking, so menace is
// there as blockers are declared (rule 702.110b) and gone once combat ends.

const TEXT = "Attacking creatures you control get +1/+0 and have menace.";

export default defineCard({
  name: "Gruul War Chant",
  manaCost: "{2}{R}{G}",
  colors: ["G", "R"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", attacking: true, controlledBy: "you" } },
      grantPt: [1, 0],
      grantKeywords: ["menace"],
      text: TEXT,
    },
  ],
});
