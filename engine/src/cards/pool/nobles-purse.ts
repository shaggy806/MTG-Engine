import { defineCard } from "../define.js";

// EDHREC rank 6407.
// Makes Treasure → use "Treasure Token".

const ENTER_TEXT = "This artifact enters tapped and with three coin counters on it.";
const TREASURE_TEXT = "{T}, Remove a coin counter from this artifact: Create a Treasure token.";

export default defineCard({
  name: "Noble's Purse",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: `${ENTER_TEXT}\n${TREASURE_TEXT} (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true, counters: { kind: "coin", amount: 3 } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "coin", count: 1 } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
