import { defineCard } from "../define.js";

const DIES = "Whenever a creature an opponent controls dies, create a Treasure token.";
const UPKEEP = "At the beginning of your upkeep, if you control ten or more Treasures, you win the game.";

// The upkeep ability is an intervening-if (rule 603.4): ten Treasures as the
// upkeep begins, and again as it resolves (the rulings).
export default defineCard({
  name: "Revel in Riches",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${DIES} (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")\n${UPKEEP}`,
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: DIES,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { subtype: "Treasure" }, atLeast: 10 },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
