import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The right door of Defiled Crypt // Cadaver Lab (defiled-crypt-cadaver-lab.ts).
const UNLOCK = "When you unlock this door, return target creature card from your graveyard to your hand.";

export default defineCard({
  name: "Cadaver Lab",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("right"),
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Defiled Crypt // Cadaver Lab", "Defiled Crypt", "Cadaver Lab"],
  split: true,
});
