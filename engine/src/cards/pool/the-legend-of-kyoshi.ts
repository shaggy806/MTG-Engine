import { defineCard } from "../define.js";

// EDHREC rank 3079. Chapter II's X is counted as it resolves; the land
// becomes an Island for as long as it stays on the battlefield, and gains
// the Island's "{T}: Add {U}" with the type (rule 305.6). Chapter III is
// Jugan Defends the Temple's: a flicker of the Saga back face up; a copy
// that isn't double-faced stays in exile (rule 712.14a).
const CHAPTER_I = "I — Draw cards equal to the greatest power among creatures you control.";
const CHAPTER_II =
  "II — Earthbend X, where X is the number of cards in your hand. That land becomes an Island in addition to its other types.";
const CHAPTER_III = "III — Exile this Saga, then return it to the battlefield transformed under your control.";
const YOUR_CREATURES = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "The Legend of Kyoshi",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter.)\n${CHAPTER_I}\n${CHAPTER_II}\n${CHAPTER_III}`,
  faces: ["The Legend of Kyoshi", "Avatar Kyoshi"],
  transform: true,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "draw", amount: { aggregate: "max", of: "power", filter: YOUR_CREATURES } },
      resolve: null,
      text: CHAPTER_I,
    },
    {
      at: [2],
      targets: ["land-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "earthbend", target: 0, amount: { cardsInHand: "you" } },
          { kind: "add-types", target: 0, addSubtypes: ["Island"], duration: "permanent" },
        ],
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
