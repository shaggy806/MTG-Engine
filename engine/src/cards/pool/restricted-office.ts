import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The left door of Restricted Office // Lecture Hall (restricted-office-lecture-hall.ts).
const UNLOCK = "When you unlock this door, destroy all creatures with power 3 or greater.";

export default defineCard({
  name: "Restricted Office",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("left"),
      targets: [],
      effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 3 } } },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Restricted Office // Lecture Hall", "Restricted Office", "Lecture Hall"],
  split: true,
});
