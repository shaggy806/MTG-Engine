import { defineCard } from "../define.js";

const COST_TEXT = "The first face-down creature spell you cast each turn costs {3} less to cast.";
const DRAW_TEXT = "Whenever a face-down creature you control enters, draw a card.";

// A face-down spell is a 2/2 creature spell (rule 708.4), cast for {3} with
// morph or disguise; the first each turn costs {3} less (Conduit of Ruin's
// shape), the face-down spells cast earlier read from their snapshots. A
// manifested or cloaked creature enters face down too, and draws.
export default defineCard({
  name: "Kadena, Slinking Sorcerer",
  manaCost: "{1}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Snake", "Wizard", "Sorcerer"],
  power: 3,
  toughness: 3,
  text: `${COST_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", faceDown: true },
        caster: "you",
        reduceGeneric: 3,
        firstEachTurn: true,
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature", faceDown: true } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
