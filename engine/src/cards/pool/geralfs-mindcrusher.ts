import { defineCard } from "../define.js";

export default defineCard({
  name: "Geralf's Mindcrusher",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Zombie", "Horror"],
  power: 5,
  toughness: 5,
  text:
    "When this creature enters, target player mills five cards.\n" +
    "Undying (When this creature dies, if it had no +1/+1 counters on it, return it to the battlefield under its owner's control with a +1/+1 counter on it.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 5 },
      resolve: null,
      text: "When this creature enters, target player mills five cards.",
    },
    {
      // Undying (rule 702.92) is a real triggered ability, so it uses the
      // stack and can be responded to. "If it had no +1/+1 counters on it"
      // is an intervening-if reading last-known information — the card is
      // already in the graveyard by the time it's checked.
      trigger: { on: "dies", who: "self" },
      condition: {
        kind: "self-counters",
        counter: "+1/+1",
        compare: { op: "eq", n: 0 },
      },
      targets: [],
      effect: {
        kind: "put-onto-battlefield",
        target: "trigger-object",
        withCounters: { kind: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: "Undying (When this creature dies, if it had no +1/+1 counters on it, return it to the battlefield under its owner's control with a +1/+1 counter on it.)",
    },
  ],
});
