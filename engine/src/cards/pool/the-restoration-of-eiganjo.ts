import { defineCard } from "../define.js";

// EDHREC rank 4364. Chapter II's "when you do" is a reflexive trigger (rule
// 603.12) after a discard that happened (`this-way`: nothing with an empty
// hand), so its target is chosen once the card is in the graveyard — the
// discarded card itself may be the one returned. Chapter III is Jugan Defends
// the Temple's: a flicker of the Saga back face up; a copy that isn't
// double-faced stays in exile (rule 712.14a).
const CHAPTER_I = "I — Search your library for a basic Plains card, reveal it, put it into your hand, then shuffle.";
const RETURN_TEXT =
  "When you do, return target permanent card with mana value 2 or less from your graveyard to the battlefield tapped.";
const CHAPTER_II = `II — You may discard a card. ${RETURN_TEXT}`;
const CHAPTER_III = "III — Exile this Saga, then return it to the battlefield transformed under your control.";

export default defineCard({
  name: "The Restoration of Eiganjo",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter.)\n${CHAPTER_I}\n${CHAPTER_II}\n${CHAPTER_III}`,
  faces: ["The Restoration of Eiganjo", "Architect of Restoration"],
  transform: true,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtype: "Plains" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: CHAPTER_I,
    },
    {
      at: [2],
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: {
                kind: "reflexive-trigger",
                targets: [
                  {
                    kind: "card-in-graveyard",
                    whose: "you",
                    filter: {
                      notTypes: ["instant", "sorcery"],
                      manaValue: { op: "lte", n: 2 },
                    },
                  },
                ],
                effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
                text: RETURN_TEXT,
              },
            },
          ],
        },
      },
      resolve: null,
      text: CHAPTER_II,
    },
    {
      at: [3],
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true, underYourControl: true },
      resolve: null,
      text: CHAPTER_III,
    },
  ],
});
