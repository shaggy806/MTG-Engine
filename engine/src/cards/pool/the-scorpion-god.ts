import { defineCard } from "../define.js";

// EDHREC rank 5178.
//
// Rulings:
//   [2017-07-14] If a creature with a -1/-1 counter on it dies at the same time as The Scorpion
//     God does, you'll draw a card. The same is true if The Scorpion God dies with a -1/-1 counter
//     on it.
//   [2017-07-14] You'll draw only one card when a creature with more than one -1/-1 counter on it
//     dies.

export default defineCard({
  name: "The Scorpion God",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 6,
  toughness: 5,
  text: "Whenever a creature with a -1/-1 counter on it dies, draw a card.\n{1}{B}{R}: Put a -1/-1 counter on another target creature.\nWhen The Scorpion God dies, return it to its owner's hand at the beginning of the next end step.",
  activated: [
    {
      cost: { mana: "{1}{B}{R}", tap: false },
      targets: [{ kind: "other", of: "creature" }],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
      resolve: null,
      text: "{1}{B}{R}: Put a -1/-1 counter on another target creature.",
    },
  ],
  triggered: [
    {
      // Blowfly Infestation's trigger: the counters as it last existed, so
      // The Scorpion God itself counts (the rulings), one draw per creature.
      trigger: {
        on: "dies",
        who: "any",
        filter: { type: "creature", counters: { kind: "-1/-1", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a creature with a -1/-1 counter on it dies, draw a card.",
    },
    {
      // The Locust God's shape.
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
        text: "Return The Scorpion God to its owner's hand.",
      },
      resolve: null,
      text: "When The Scorpion God dies, return it to its owner's hand at the beginning of the next end step.",
    },
  ],
});
