import { defineCard } from "../define.js";

// EDHREC rank 2733.
//
// "Four or more artifacts" counts Shimmer Dragon itself should it become an
// artifact (`countsSelf`), and the tap cost may tap it then too (`includeSelf`).
const HEXPROOF_TEXT = "As long as you control four or more artifacts, this creature has hexproof.";
const DRAW_TEXT = "Tap two untapped artifacts you control: Draw a card.";

export default defineCard({
  name: "Shimmer Dragon",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${HEXPROOF_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 4, countsSelf: true },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
  ],
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { type: "artifact", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
