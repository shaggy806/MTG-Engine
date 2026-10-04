import { defineCard } from "../define.js";

// EDHREC rank 6124.
// Chapter III is Michiko's Reign of Truth's shape: it comes back as Branch of
// Boseiju, a new object that's no Saga.

const I_TEXT =
  "I — Search your library for up to two basic Forest cards, reveal them, put them into your hand, then shuffle.";
const II_TEXT = "II — Put up to one target land card from your graveyard on top of your library.";
const III_TEXT = "III — Exile this Saga, then return it to the battlefield transformed under your control.";

export default defineCard({
  name: "Boseiju Reaches Skyward",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter.)\n${I_TEXT}\n${II_TEXT}\n${III_TEXT}`,
  faces: ["Boseiju Reaches Skyward", "Branch of Boseiju"],
  transform: true,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land", subtype: "Forest" },
        destination: "hand",
        reveal: true,
        min: 0,
        max: 2,
      },
      resolve: null,
      text: I_TEXT,
    },
    {
      at: [2],
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "land" } } }],
      effect: { kind: "put-on-library", target: 0, position: "top" },
      resolve: null,
      text: II_TEXT,
    },
    {
      at: [3],
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true, underYourControl: true },
      resolve: null,
      text: III_TEXT,
    },
  ],
});
