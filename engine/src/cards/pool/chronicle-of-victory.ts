import { defineCard } from "../define.js";

const PUMP_TEXT = "Creatures you control of the chosen type get +2/+2 and have first strike and trample.";
const CAST_TEXT = "Whenever you cast a spell of the chosen type, draw a card.";

// Door of Destinies' shape: the type is chosen as it enters. The draw
// resolves before the spell, even if that spell is countered (its ruling).
export default defineCard({
  name: "Chronicle of Victory",
  manaCost: "{6}",
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `As Chronicle of Victory enters, choose a creature type.\n${PUMP_TEXT}\n${CAST_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", ofChosenType: true } },
      grantPt: [2, 2],
      grantKeywords: ["first-strike", "trample"],
      text: PUMP_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { ofChosenType: true } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
