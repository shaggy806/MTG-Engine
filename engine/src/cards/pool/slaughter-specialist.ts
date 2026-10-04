import { defineCard } from "../define.js";

// EDHREC rank 4653.

export default defineCard({
  name: "Slaughter Specialist",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warrior"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, each opponent creates a 1/1 white Human creature token.\nWhenever a creature an opponent controls dies, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Akroan Horse's "each opponent creates".
      effect: { kind: "create-token", token: "Human Token", count: 1, who: "each-opponent" },
      resolve: null,
      text: "When this creature enters, each opponent creates a 1/1 white Human creature token.",
    },
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, put a +1/+1 counter on this creature.",
    },
  ],
});
