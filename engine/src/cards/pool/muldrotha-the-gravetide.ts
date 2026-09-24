import { defineCard } from "../define.js";

// Top-commanders rank 41. Each permanent type is its own allowance, so a
// multi-typed card spends the one its player picks (an artifact creature as
// the artifact or the creature — each is a separate `LegalAction` variant),
// and the land is *played*, still taking the land drop. The allowances are
// per Muldrotha: a new one that turn grants a fresh set (2018 ruling).
// Timing is the spell's own — this is a permission, not flash.
export default defineCard({
  name: "Muldrotha, the Gravetide",
  manaCost: "{3}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Avatar"],
  power: 6,
  toughness: 6,
  text:
    "During each of your turns, you may play a land and cast a permanent spell of each " +
    "permanent type from your graveyard. (If a card has multiple permanent types, choose one " +
    "as you play it.)",
  static: [
    {
      affects: { scope: "self" },
      castFromGraveyard: {
        filter: {},
        yourTurnOnly: true,
        perType: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
      },
      text:
        "During each of your turns, you may play a land and cast a permanent spell of each " +
        "permanent type from your graveyard.",
    },
  ],
});
