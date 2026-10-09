import { defineCard } from "../define.js";

// EDHREC rank 3461. Dredge is `CardDefinition.dredge` (Life from the Loam's).
// The dies trigger targets as it goes on the stack, with the Thug already in
// the graveyard, so it may put itself back on top (Volrath's Stronghold's
// `put-on-library`).
const DIES_TEXT =
  "When this creature dies, put target creature card from your graveyard on top of your library.";

export default defineCard({
  name: "Golgari Thug",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 1,
  toughness: 1,
  dredge: 4,
  text:
    `${DIES_TEXT}\n` +
    "Dredge 4 (If you would draw a card, you may mill four cards instead. If you do, return this card from your graveyard to your hand.)",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-on-library", target: 0, position: "top" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
