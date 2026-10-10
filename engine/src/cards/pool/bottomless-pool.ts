import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The left door of Bottomless Pool // Locker Room (bottomless-pool-locker-room.ts).
const UNLOCK = "When you unlock this door, return up to one target creature to its owner's hand.";

export default defineCard({
  name: "Bottomless Pool",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("left"),
      targets: [{ kind: "optional", of: "creature" }],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Bottomless Pool // Locker Room", "Bottomless Pool", "Locker Room"],
  split: true,
});
