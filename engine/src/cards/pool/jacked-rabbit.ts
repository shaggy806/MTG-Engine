import { defineCard } from "../define.js";
import { ravenous } from "../helpers.js";

const RAVENOUS = ravenous();
const ATTACK_TEXT =
  "Whenever this creature attacks, create a number of 1/1 white Rabbit creature tokens equal to this creature's power.";

// Its power as the trigger resolves, or as it last existed on the battlefield
// if it has left (the ruling).
export default defineCard({
  name: "Jacked Rabbit",
  manaCost: "{X}{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rabbit", "Warrior"],
  power: 1,
  toughness: 2,
  text:
    "Ravenous (This creature enters with X +1/+1 counters on it. If X is 5 or more, draw a card when it enters.)\n" +
    ATTACK_TEXT,
  static: [RAVENOUS.static],
  triggered: [
    RAVENOUS.triggered,
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Rabbit Token", count: { powerOf: "source" } },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
