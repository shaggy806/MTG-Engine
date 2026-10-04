import { defineCard } from "../define.js";

// EDHREC rank 2416.
//
// Herald's Horn's shape: the type is chosen as it enters (an existing
// creature type — its ruling), and both the anthem and the look read it.
// Only a creature card of the chosen type may be taken, revealed as it's
// taken; the rest go to the bottom in a random order.
const CHOOSE_TEXT = "As this artifact enters, choose a creature type.";
const PUMP_TEXT = "Creatures you control of the chosen type get +1/+1.";
const LOOK_TEXT =
  "{3}, {T}: Look at the top three cards of your library. You may reveal a creature card of the " +
  "chosen type from among them and put it into your hand. Put the rest on the bottom of your " +
  "library in a random order.";

export default defineCard({
  name: "Icon of Ancestry",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${CHOOSE_TEXT}\n${PUMP_TEXT}\n${LOOK_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", ofChosenType: true } },
      grantPt: [1, 1],
      text: PUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 3,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { type: "creature", ofChosenType: true },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
});
