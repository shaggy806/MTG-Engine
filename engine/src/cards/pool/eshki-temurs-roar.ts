import { defineCard } from "../define.js";

// #146 in top-commanders.txt.
//
// "That spell's power" reads the creature spell (the trigger object) on the
// stack, or as it last existed there once it has resolved or been countered.
// The damage is Eshki's power after the counter goes on.
const TRIGGER_TEXT =
  "Whenever you cast a creature spell, put a +1/+1 counter on Eshki. If that spell's power is 4 " +
  "or greater, draw a card. If that spell's power is 6 or greater, Eshki deals damage equal to " +
  "Eshki's power to each opponent.";

export default defineCard({
  name: "Eshki, Temur's Roar",
  manaCost: "{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 2,
  text: TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "trigger-object", filter: { power: { op: "gte", n: 4 } } },
            then: { kind: "draw", amount: 1 },
          },
          {
            kind: "conditional",
            condition: { kind: "trigger-object", filter: { power: { op: "gte", n: 6 } } },
            then: { kind: "damage", amount: { powerOf: "source" }, who: "each-opponent" },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
