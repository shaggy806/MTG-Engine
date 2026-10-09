import { defineCard } from "../define.js";

// Family Matters. "Each creature that attacked this turn" is every creature
// declared as an attacker this turn, whoever's it was and wherever it is now —
// the `"attackers"` turn stat over every player (one put onto the
// battlefield attacking never attacked, rule 508.4).
const COST_TEXT = "This spell costs {1} less to cast for each creature that attacked this turn.";

export default defineCard({
  name: "Rowdy Research",
  manaCost: "{6}{U}",
  colors: ["U"],
  types: ["instant"],
  text: `${COST_TEXT}\nDraw three cards.`,
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { turnStat: "attackers", who: "any-player" },
  },
  effect: { kind: "draw", amount: 3 },
});
