import { defineCard } from "../define.js";

// #243 in top-commanders.txt.
//
// The batched exile trigger fires once per simultaneous move, and only
// during your turn (checked as it triggers and on resolution).
const RESTRICT_TEXT = "Ketramose can't attack or block unless there are seven or more cards in exile.";
const EXILE_TEXT =
  "Whenever one or more cards are put into exile from graveyards and/or the battlefield during your " +
  "turn, you draw a card and lose 1 life.";

export default defineCard({
  name: "Ketramose, the New Dawn",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 4,
  keywords: ["menace", "lifelink", "indestructible"],
  text: `Menace, lifelink, indestructible\n${RESTRICT_TEXT}\n${EXILE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "not", of: { kind: "cards-in-exile", atLeast: 7 } },
      restrictions: ["cant-attack", "cant-block"],
      text: RESTRICT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "put-into-exile", who: "any", from: ["graveyard", "battlefield"] },
      condition: { kind: "your-turn" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
