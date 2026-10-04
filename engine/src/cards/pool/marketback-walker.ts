import { defineCard } from "../define.js";

// EDHREC rank 4018.

// "For each +1/+1 counter on it" is read as it last existed on the battlefield
// (Chasm Skulker's shape) — the move to the graveyard clears the counters.
export default defineCard({
  name: "Marketback Walker",
  manaCost: "{X}{X}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 0,
  text: "This creature enters with X +1/+1 counters on it.\n{4}: Put a +1/+1 counter on this creature.\nWhen this creature dies, draw a card for each +1/+1 counter on it.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
  activated: [
    {
      cost: { mana: "{4}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{4}: Put a +1/+1 counter on this creature.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { countersOn: "source", counter: "+1/+1" } },
      resolve: null,
      text: "When this creature dies, draw a card for each +1/+1 counter on it.",
    },
  ],
});
