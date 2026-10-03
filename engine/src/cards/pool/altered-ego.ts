import { defineCard } from "../define.js";

const COPY_TEXT =
  "You may have this creature enter as a copy of any creature on the battlefield, except it enters with X " +
  "additional +1/+1 counters on it.";

// X is the X it was cast with; declining, it gets no counters (its ruling)
// and is a 0/0. The counters are an additional effect of copying (rule
// 707.9e), not something a copy of it gets.
export default defineCard({
  name: "Altered Ego",
  manaCost: "{X}{2}{G}{U}",
  colors: ["G", "U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 0,
  toughness: 0,
  cantBeCountered: true,
  text: `This spell can't be countered.\n${COPY_TEXT}`,
  copyOnEnter: {
    filter: { type: "creature" },
    counters: [{ kind: "+1/+1", amount: "x" }],
  },
});
