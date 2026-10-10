import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The right door of Funeral Room // Awakening Hall (funeral-room-awakening-hall.ts).
const UNLOCK = "When you unlock this door, return all creature cards from your graveyard to the battlefield.";

export default defineCard({
  name: "Awakening Hall",
  manaCost: "{6}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("right"),
      targets: [],
      effect: { kind: "return-from-graveyard", filter: { type: "creature" }, destination: "battlefield", count: "all" },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Funeral Room // Awakening Hall", "Funeral Room", "Awakening Hall"],
  split: true,
});
