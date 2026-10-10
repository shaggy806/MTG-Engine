import { defineCard } from "../define.js";
import { ROOM_REMINDER } from "../helpers.js";

// The right door of Spiked Corridor // Torture Pit (spiked-corridor-torture-pit.ts). An opponent only, not their permanents.
const PIT = "If a source you control would deal noncombat damage to an opponent, it deals that much damage plus 2 instead.";

export default defineCard({
  name: "Torture Pit",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${PIT}\n${ROOM_REMINDER}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        plus: 2,
        combat: false,
        to: "opponent",
        source: { controlledBy: "you" },
      },
      text: PIT,
    },
  ],
  faces: ["Spiked Corridor // Torture Pit", "Spiked Corridor", "Torture Pit"],
  split: true,
});
