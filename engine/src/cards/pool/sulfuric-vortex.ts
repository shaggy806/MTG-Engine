import { defineCard } from "../define.js";

// EDHREC rank 2795.
// "That player" is the one whose upkeep it is — `"active-player"` (Titan
// Hunter). The life clause is The Lord of Pain's prevention, for every player.
const UPKEEP_TEXT = "At the beginning of each player's upkeep, this enchantment deals 2 damage to that player.";
const LIFE_TEXT = "If a player would gain life, that player gains no life instead.";

export default defineCard({
  name: "Sulfuric Vortex",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${UPKEEP_TEXT}\n${LIFE_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "active-player" },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-gain-life", who: "any-player", prevent: true },
      text: LIFE_TEXT,
    },
  ],
});
