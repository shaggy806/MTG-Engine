import { defineCard } from "../define.js";

// EDHREC rank 5771.

const DRAIN_TEXT =
  "Whenever a creature dies or a creature card is put into a graveyard from a library, each opponent loses 1 life.";

export default defineCard({
  name: "Dreadhound",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon", "Dog"],
  power: 6,
  toughness: 6,
  text: "When this creature enters, mill three cards. (Put the top three cards of your library into your graveyard.)\nWhenever a creature dies or a creature card is put into a graveyard from a library, each opponent loses 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "When this creature enters, mill three cards.",
    },
    // "A creature dies or a creature card is put into a graveyard from a
    // library": two triggers, one per event, each per card.
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: DRAIN_TEXT,
    },
    {
      trigger: { on: "put-into-graveyard", who: "any", from: "library", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
