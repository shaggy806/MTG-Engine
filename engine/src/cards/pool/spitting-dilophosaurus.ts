import { defineCard } from "../define.js";

// EDHREC rank 5658.
const TRIGGER_TEXT = "Whenever this creature enters or attacks, put a -1/-1 counter on up to one target creature.";
const BLOCK_TEXT = "Creatures your opponents control with -1/-1 counters on them can't block.";
const COUNTER = { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 } as const;

export default defineCard({
  name: "Spitting Dilophosaurus",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 3,
  toughness: 2,
  text: `${TRIGGER_TEXT}\n${BLOCK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "creature" }],
      effect: COUNTER,
      resolve: null,
      text: TRIGGER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "optional", of: "creature" }],
      effect: COUNTER,
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "opponent", counters: { kind: "-1/-1", compare: { op: "gte", n: 1 } } },
      },
      restrictions: ["cant-block"],
      text: BLOCK_TEXT,
    },
  ],
});
