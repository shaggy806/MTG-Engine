import { defineCard } from "../define.js";

// EDHREC rank 3811.
//
// Deadly Dispute's additional cost; Sacrifice's `manaValueOf: "sacrificed"`.

export default defineCard({
  name: "Reckoner's Bargain",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, sacrifice an artifact or creature.\nYou gain life equal to the sacrificed permanent's mana value. Draw two cards.",
  additionalCost: { sacrifice: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" } },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-life", amount: { manaValueOf: "sacrificed" } },
      { kind: "draw", amount: 2 },
    ],
  },
});
