import { defineCard } from "../define.js";

// - A card with its own escape keeps it, and the player chooses which escape
//   applies (2020-01-24 ruling): each is offered, named by `graveyardGrant`.
// - "The card's mana cost" is the cost of the face cast, so an escaped
//   adventurer may be cast as its Adventure; a card with no mana cost can't
//   escape (ruling).
// - The sacrifice is at the beginning of *each* end step, not only yours.
const ESCAPE_TEXT =
  "Each nonland card in your graveyard has escape. The escape cost is equal to the card's mana cost " +
  "plus exile three other cards from your graveyard. (You may cast cards from your graveyard for " +
  "their escape cost.)";
const SACRIFICE_TEXT = "At the beginning of the end step, sacrifice this enchantment.";

export default defineCard({
  name: "Underworld Breach",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${ESCAPE_TEXT}\n${SACRIFICE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToGraveyard: { filter: { notTypes: ["land"] }, escape: { cost: "mana-cost", exileCount: 3 } },
      text: ESCAPE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: { kind: "sacrifice-source" },
      resolve: null,
      text: SACRIFICE_TEXT,
    },
  ],
});
