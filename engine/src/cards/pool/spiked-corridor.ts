import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The left door of Spiked Corridor // Torture Pit (spiked-corridor-torture-pit.ts).
const UNLOCK =
  'When you unlock this door, create three 1/1 red Devil creature tokens with "When this token dies, it deals 1 damage to any target."';

export default defineCard({
  name: "Spiked Corridor",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("left"),
      targets: [],
      effect: { kind: "create-token", token: "Devil Token", count: 3 },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Spiked Corridor // Torture Pit", "Spiked Corridor", "Torture Pit"],
  split: true,
});
