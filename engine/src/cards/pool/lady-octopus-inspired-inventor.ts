import { defineCard } from "../define.js";

// EDHREC rank 5369.
//
// Rulings:
//   [2025-09-19] You don't have to cast a spell as that ability resolves. If you choose not to for
//     some reason, don't let anyone judge your genius plans.
//   [2025-09-19] The spell is cast as Lady Octopus's last ability resolves. You can't wait and
//     cast it later.

const DRAW_TEXT =
  "Whenever you draw your first or second card each turn, put an ingenuity counter on Lady Octopus.";

export default defineCard({
  name: "Lady Octopus, Inspired Inventor",
  manaCost: "{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scientist", "Villain"],
  power: 0,
  toughness: 2,
  text: "Whenever you draw your first or second card each turn, put an ingenuity counter on Lady Octopus.\n{T}: You may cast an artifact spell from your hand with mana value less than or equal to the number of ingenuity counters on Lady Octopus without paying its mana cost.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      // Cast as the ability resolves or not at all (the rulings); the count
      // is read then.
      effect: {
        kind: "cast-now",
        from: "hand",
        free: true,
        spell: {
          type: "artifact",
          manaValue: { op: "lte", n: { amount: { countersOn: "source", counter: "ingenuity" } } },
        },
      },
      resolve: null,
      text: "{T}: You may cast an artifact spell from your hand with mana value less than or equal to the number of ingenuity counters on Lady Octopus without paying its mana cost.",
    },
  ],
  // "Your first or second card" is one trigger for each: the turn's whole
  // count of cards drawn decides which, drawn before she arrived or not.
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 1 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "ingenuity", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "ingenuity", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
