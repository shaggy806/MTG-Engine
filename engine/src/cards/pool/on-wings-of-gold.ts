import { defineCard } from "../define.js";

// EDHREC rank 3565.

const ANTHEM_TEXT = "Creatures you control that are Zombies and/or tokens get +1/+1 and have flying.";
const LEAVE_TEXT = "Whenever one or more cards leave your graveyard, create a 1/1 white Zombie creature token.";

export default defineCard({
  name: "On Wings of Gold",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ANTHEM_TEXT}\n${LEAVE_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", anyOf: [{ subtype: "Zombie" }, { token: true }] },
      },
      grantPt: [1, 1],
      grantKeywords: ["flying"],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      // Once per move, however many cards left together.
      trigger: { on: "leaves-graveyard", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token (On Wings of Gold)", count: 1 },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
