import { defineCard } from "../define.js";

export default defineCard({
  name: "Psychosis Crawler",
  manaCost: "{5}",
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 0,
  toughness: 0,
  text:
    "Psychosis Crawler's power and toughness are each equal to the number of cards in your hand.\n" +
    "Whenever you draw a card, each opponent loses 1 life.",
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: "cards-in-your-hand", plusPower: 0, plusToughness: 0 },
      text: "Psychosis Crawler's power and toughness are each equal to the number of cards in your hand.",
    },
  ],
  triggered: [
    {
      // Once per card drawn (2011-06-01 ruling).
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "lose-life", who: "each-opponent", amount: 1 },
      resolve: null,
      text: "Whenever you draw a card, each opponent loses 1 life.",
    },
  ],
});
