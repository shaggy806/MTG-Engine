import { defineCard } from "../define.js";

// EDHREC rank 6344.
//
// Rulings:
//   [2025-07-25] If an effect refers to a Food, it means any Food artifact, not just a Food token.
//     For example, when you activate the second ability of Ragost, Deft Gastronaut (which says
//     “{1}, {T}, Sacrifice a Food: Ragost deals 3 damage to each opponent”), you can sacrifice
//     Nutrient Block to pay its cost.
//   [2025-07-25] You can’t sacrifice a Food to pay multiple costs. For example, you can’t
//     sacrifice a Nutrient Block to activate its own last ability and also to pay the cost of
//     Ragost, Deft Gastronaut’s second ability.

const DRAW_TEXT = "When this artifact is put into a graveyard from the battlefield, draw a card.";

export default defineCard({
  name: "Nutrient Block",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Food"],
  keywords: ["indestructible"],
  text:
    "Indestructible (Effects that say \"destroy\" don't destroy this artifact.)\n" +
    "{2}, {T}, Sacrifice this artifact: You gain 3 life.\n" +
    DRAW_TEXT,
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: You gain 3 life.",
    },
  ],
  triggered: [
    {
      // Chromatic Star's shape.
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
