import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The right door of Unholy Annex // Ritual Chamber (unholy-annex-ritual-chamber.ts).
const UNLOCK = "When you unlock this door, create a 6/6 black Demon creature token with flying.";

export default defineCard({
  name: "Ritual Chamber",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("right"),
      targets: [],
      effect: { kind: "create-token", token: "Demon Token", count: 1 },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Unholy Annex // Ritual Chamber", "Unholy Annex", "Ritual Chamber"],
  split: true,
});
