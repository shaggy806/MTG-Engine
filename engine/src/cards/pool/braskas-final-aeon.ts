import { defineCard } from "../define.js";

// Jecht, Reluctant Guardian's back face — Ifrit, Warden of Inferno's shape (a
// Saga creature entering transformed gets its first lore counter as it
// enters). After III it's sacrificed, as any Saga is (rule 714.4).
const BEAM_TEXT = "I, II — Jecht Beam — Each opponent discards a card and you draw a card.";
const SHOT_TEXT = "III — Ultimate Jecht Shot — Each opponent sacrifices two creatures of their choice.";

export default defineCard({
  name: "Braska's Final Aeon",
  art: "https://cards.scryfall.io/art_crop/back/4/e/4ec91fe8-b3da-47fa-b45e-94b62a260aba.jpg",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Nightmare"],
  power: 7,
  toughness: 7,
  keywords: ["menace"],
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n${BEAM_TEXT}\n${SHOT_TEXT}\nMenace`,
  chapters: [
    {
      at: [1, 2],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard", target: "each-opponent", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: BEAM_TEXT,
    },
    {
      at: [3],
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 2 },
      resolve: null,
      text: SHOT_TEXT,
    },
  ],
  faces: ["Jecht, Reluctant Guardian", "Braska's Final Aeon"],
  transform: true,
});
