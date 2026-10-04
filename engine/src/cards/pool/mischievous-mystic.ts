import { defineCard } from "../define.js";

// EDHREC rank 2735.
//
// "Your second card each turn" is the drawing player's own count (`nthEachTurn`),
// so the first card needn't have been drawn while you controlled it (the ruling).

const DRAW_TEXT = "Whenever you draw your second card each turn, create a 1/1 blue Faerie creature token with flying.";

export default defineCard({
  name: "Mischievous Mystic",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Faerie Token", count: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
