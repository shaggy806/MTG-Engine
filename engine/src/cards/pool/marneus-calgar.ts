import { defineCard } from "../define.js";

// #110 in top-commanders.txt.
const TACTICIAN_TEXT = "Master Tactician — Whenever one or more tokens you control enter, draw a card.";
const CHAPTER_TEXT =
  "Chapter Master — {6}: Create two 2/2 white Astartes Warrior creature tokens with vigilance.";

export default defineCard({
  name: "Marneus Calgar",
  manaCost: "{2}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Astartes", "Warrior"],
  power: 3,
  toughness: 5,
  keywords: ["double-strike"],
  text: `Double strike\n${TACTICIAN_TEXT}\n${CHAPTER_TEXT}`,
  triggered: [
    {
      // Once per simultaneous entry: Chapter Master's two tokens draw one card.
      trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true }, batched: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TACTICIAN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{6}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Astartes Warrior Token", count: 2 },
      resolve: null,
      text: CHAPTER_TEXT,
    },
  ],
});
