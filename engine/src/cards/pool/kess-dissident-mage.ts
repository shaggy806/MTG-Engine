import { defineCard } from "../define.js";

// Top-commanders rank 327. The rulings: one instant or sorcery a turn, only
// during your own turn, at its normal timing and for its costs. A spell cast
// this way is exiled instead of going to your graveyard however it leaves
// the stack (resolved, countered, fizzled), even if Kess has left by then —
// which is why that's a mark on the spell rather than a replacement Kess
// applies while it's on the battlefield.
export default defineCard({
  name: "Kess, Dissident Mage",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Once during each of your turns, you may cast an instant or sorcery spell from your " +
    "graveyard. If a spell cast this way would be put into your graveyard, exile it instead.",
  static: [
    {
      affects: { scope: "self" },
      castFromGraveyard: {
        filter: { typesAnyOf: ["instant", "sorcery"] },
        oncePerTurn: true,
        yourTurnOnly: true,
        exileAfterwards: true,
      },
      text:
        "Once during each of your turns, you may cast an instant or sorcery spell from your " +
        "graveyard. If a spell cast this way would be put into your graveyard, exile it instead.",
    },
  ],
});
