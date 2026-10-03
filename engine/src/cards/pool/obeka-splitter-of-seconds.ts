import { defineCard } from "../define.js";

// #106 in top-commanders.txt.
const TRIGGER_TEXT =
  "Whenever Obeka deals combat damage to a player, you get that many additional upkeep steps after this phase.";

// Each additional upkeep step is a beginning phase of its own after this
// combat phase, its untap and draw steps skipped (the rulings; rules 500.10,
// 500.11), and "at the beginning of your upkeep" triggers in each. "That many"
// is the combat damage Obeka dealt that player.
export default defineCard({
  name: "Obeka, Splitter of Seconds",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ogre", "Warlock"],
  power: 2,
  toughness: 5,
  keywords: ["menace"],
  text: `Menace\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "additional-upkeep-steps", amount: { triggerValue: true } },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
