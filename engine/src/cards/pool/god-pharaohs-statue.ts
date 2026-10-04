import { defineCard } from "../define.js";

// EDHREC rank 2415.
//
// The increase is generic and stacks with other increases before reductions
// apply; the mana value is unchanged (its rulings).
const COST_TEXT = "Spells your opponents cast cost {2} more to cast.";
const DRAIN_TEXT = "At the beginning of your end step, each opponent loses 1 life.";

export default defineCard({
  name: "God-Pharaoh's Statue",
  manaCost: "{6}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\n${DRAIN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: {}, caster: "opponent", increaseGeneric: 2 },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
