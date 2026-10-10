import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 3964. X is the X it was cast with: 0 rolls nothing, and one
// put onto the battlefield without being cast has X of 0 (rule 107.3m).
const ENTER =
  "When this Vehicle enters, roll X six-sided dice. For each odd result, create a 1/1 white Clown Robot artifact creature token. For each even result, put a +1/+1 counter on this Vehicle.";

export default defineCard({
  name: "Clown Car",
  manaCost: "{X}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 1,
  toughness: 1,
  text: `${ENTER}\nCrew 2`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "roll-dice",
        sides: 6,
        count: "x",
        then: {
          kind: "sequence",
          effects: [
            { kind: "create-token", token: "Clown Robot Token", count: { roll: "odd" } },
            { kind: "add-counter", target: "source", counter: "+1/+1", amount: { roll: "even" } },
          ],
        },
      },
      resolve: null,
      text: ENTER,
    },
  ],
  activated: [crew(2)],
});
