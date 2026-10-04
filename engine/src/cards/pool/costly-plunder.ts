import { defineCard } from "../define.js";

// EDHREC rank 3427.
//
// Rulings:
//   [2020-08-07] You can't cast Costly Plunder without sacrificing a permanent, and you can't
//     sacrifice additional permanents.
//   [2020-08-07] You can't sacrifice an artifact to generate mana to pay towards Costly Plunder's
//     cost and also to pay its additional cost.

export default defineCard({
  name: "Costly Plunder",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, sacrifice an artifact or creature.\nDraw two cards.",
  additionalCost: { sacrifice: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" } },
  effect: { kind: "draw", amount: 2 },
});
