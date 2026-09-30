import { defineCard } from "../define.js";

const GROW_TEXT =
  "Whenever you cast a red spell, if this creature has fewer than three +1/+1 counters on it, put a +1/+1 counter on this creature.";
const MANA_TEXT = "Remove three +1/+1 counters from this creature: Add {R}{R}{R}.";

export default defineCard({
  name: "Runaway Steam-Kin",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 1,
  toughness: 1,
  text: `${GROW_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["R"] } },
      condition: { kind: "self-counters", counter: "+1/+1", compare: { op: "lt", n: 3 } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "+1/+1", count: 3 } },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 3 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
