import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 6012.
// Makes Human Monk → new token "Human Monk Token".
// Back face: Remnant of the Rising Star (remnant-of-the-rising-star.ts).

const CHAPTER_I = 'I — Create a 1/1 green Human Monk creature token with "{T}: Add {G}."';
const CHAPTER_II = "II — Put a +1/+1 counter on each of up to two target creatures.";
const CHAPTER_III = "III — Exile this Saga, then return it to the battlefield transformed under your control.";

export default defineCard({
  name: "Jugan Defends the Temple",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter.)\n${CHAPTER_I}\n${CHAPTER_II}\n${CHAPTER_III}`,
  faces: ["Jugan Defends the Temple", "Remnant of the Rising Star"],
  transform: true,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "create-token", token: "Human Monk Token", count: 1 },
      resolve: null,
      text: CHAPTER_I,
    },
    {
      at: [2],
      targets: distinctTargets(2, "creature", { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: CHAPTER_II,
    },
    {
      at: [3],
      targets: [],
      // Michiko's Reign of Truth's shape: it comes back as a new object that
      // isn't a Saga.
      effect: { kind: "flicker", target: "source", transformed: true, underYourControl: true },
      resolve: null,
      text: CHAPTER_III,
    },
  ],
});
