import { defineCard } from "../define.js";

// The back face of Kefka, Court Mage.
const TRIGGER_TEXT = "Whenever an opponent loses life during your turn, you draw that many cards.";

export default defineCard({
  name: "Kefka, Ruler of Ruin",
  art: "https://cards.scryfall.io/art_crop/back/8/f/8fcf3fbb-1ddd-437e-81c1-f5a3133f5ee8.jpg",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar", "Wizard"],
  power: 5,
  toughness: 7,
  keywords: ["flying"],
  text: `Flying\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "loses-life", who: "opponent" },
      condition: { kind: "your-turn" },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  faces: ["Kefka, Court Mage", "Kefka, Ruler of Ruin"],
  transform: true,
});
