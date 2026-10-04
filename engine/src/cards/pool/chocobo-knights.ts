import { defineCard } from "../define.js";

// EDHREC rank 4257.

const TEXT =
  "Whenever you attack, creatures you control with counters on them gain double strike until end of turn.";

export default defineCard({
  name: "Chocobo Knights",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      // "With counters on them" — a counter of any kind (`kind` omitted), read
      // as the trigger resolves; a one-shot grant to the creatures matching then.
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you", counters: { compare: { op: "gte", n: 1 } } },
        keyword: "double-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
