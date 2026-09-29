import { defineCard } from "../define.js";

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, you gain 1 life.";

// A land played from the top is the turn's land play, at the usual timing
// (the rulings).
export default defineCard({
  name: "Courser of Kruphix",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Centaur"],
  power: 2,
  toughness: 4,
  text:
    "Play with the top card of your library revealed.\n" +
    `You may play lands from the top of your library.\n${LANDFALL_TEXT}`,
  revealsOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      playFromLibraryTop: { type: "land" },
      text: "You may play lands from the top of your library.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
