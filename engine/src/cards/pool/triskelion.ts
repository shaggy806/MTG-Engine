import { defineCard } from "../define.js";

// EDHREC rank 4760.
// Walking Ballista's ping and Fertilid's "enters with" counters.
const ENTER_TEXT = "This creature enters with three +1/+1 counters on it.";
const PING_TEXT = "Remove a +1/+1 counter from this creature: It deals 1 damage to any target.";

export default defineCard({
  name: "Triskelion",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 1,
  text: `${ENTER_TEXT}\n${PING_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 3 } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: PING_TEXT,
    },
  ],
});
