import { defineCard } from "../define.js";

// EDHREC rank 5275.

export default defineCard({
  name: "Gruff Triplets",
  manaCost: "{3}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, if it isn't a token, create two tokens that are copies of it.\nWhen this creature dies, put a number of +1/+1 counters equal to its power on each creature you control named Gruff Triplets.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Vaultborn Tyrant's intervening-if shape.
      condition: { kind: "source", filter: { token: false } },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 2, who: "you" },
      resolve: null,
      text: "When this creature enters, if it isn't a token, create two tokens that are copies of it.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      // Its power as it last existed on the battlefield (rule 603.10a).
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you", name: "Gruff Triplets" },
        counter: "+1/+1",
        amount: { powerOf: "source" },
      },
      resolve: null,
      text: "When this creature dies, put a number of +1/+1 counters equal to its power on each creature you control named Gruff Triplets.",
    },
  ],
});
