import { defineCard } from "../define.js";

// EDHREC rank 5187.
//
// Rulings:
//   [2025-06-06] To double the number of +1/+1 counters on a permanent, put a number of +1/+1
//     counters on it equal to the number it already has. Other effects that interact with putting
//     counters on it will interact with this effect accordingly.

export default defineCard({
  name: "Sazh Katzroy",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Pilot"],
  power: 3,
  toughness: 3,
  text: "When Sazh Katzroy enters, you may search your library for a Bird or basic land card, reveal it, put it into your hand, then shuffle.\nWhenever Sazh Katzroy attacks, put a +1/+1 counter on target creature, then double the number of +1/+1 counters on that creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Borderland Ranger's "you may search" (min 0).
      effect: {
        kind: "search-library",
        filter: { anyOf: [{ subtype: "Bird" }, { supertype: "basic", type: "land" }] },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When Sazh Katzroy enters, you may search your library for a Bird or basic land card, reveal it, put it into your hand, then shuffle.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      // Invigorating Surge's shape.
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "double-counters", target: 0, counter: "+1/+1" },
        ],
      },
      resolve: null,
      text: "Whenever Sazh Katzroy attacks, put a +1/+1 counter on target creature, then double the number of +1/+1 counters on that creature.",
    },
  ],
});
