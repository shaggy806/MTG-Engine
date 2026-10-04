import { defineCard } from "../define.js";

// EDHREC rank 3290.
//
// Bushwhack's fight mode and Izzet Charm's "counter unless its controller
// pays" mode. "Creature you don't control" is a creature an opponent controls.

const FIGHT_TEXT = "Target creature you control fights target creature you don't control.";
const COUNTER_TEXT = "Counter target noncreature spell unless its controller pays {3}.";

export default defineCard({
  name: "Decisive Denial",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["instant"],
  text: `Choose one —\n• ${FIGHT_TEXT} (Each deals damage equal to its power to the other.)\n• ${COUNTER_TEXT}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: FIGHT_TEXT,
        targets: ["creature-you-control", "creature-an-opponent-controls"],
        effect: { kind: "fight", a: 0, b: 1 },
      },
      {
        text: COUNTER_TEXT,
        targets: ["noncreature-spell"],
        effect: {
          kind: "unless",
          chooser: 0,
          options: [{ pay: "{3}", text: "Pay {3}" }],
          otherwise: { kind: "counter", target: 0 },
        },
      },
    ],
  },
});
