import { defineCard } from "../define.js";

// The back face of Serah Farron.

const COST_TEXT = "The first legendary creature spell you cast each turn costs {2} less to cast.";
const ANTHEM_TEXT = "Legendary creatures you control get +2/+2.";

export default defineCard({
  name: "Crystallized Serah",
  art: "https://cards.scryfall.io/art_crop/back/6/2/62fa74c0-43ae-445c-8039-ca9d00e9709a.jpg",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\n${ANTHEM_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", supertype: "legendary" },
        caster: "you",
        reduceGeneric: 2,
        firstEachTurn: true,
      },
      text: COST_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      grantPt: [2, 2],
      text: ANTHEM_TEXT,
    },
  ],
  faces: ["Serah Farron", "Crystallized Serah"],
  transform: true,
});
