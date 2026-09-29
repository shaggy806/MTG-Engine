import { defineCard } from "../define.js";

const CAST_TEXT = "Whenever you cast a spell of the chosen type, put a charge counter on this artifact.";
const PUMP_TEXT = "Creatures you control of the chosen type get +1/+1 for each charge counter on this artifact.";

// The counter goes on as the spell is cast, so a creature spell of the type
// enters already getting the bonus (the ruling).
export default defineCard({
  name: "Door of Destinies",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: `As this artifact enters, choose a creature type.\n${CAST_TEXT}\n${PUMP_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { ofChosenType: true } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", ofChosenType: true } },
      grantPtPerCount: { countersOnSource: "charge", pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
});
