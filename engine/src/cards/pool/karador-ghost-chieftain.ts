import { defineCard } from "../define.js";

// Top-commanders rank 450. The reduction counts creature cards in your
// graveyard as the cost is determined, after any increase such as commander
// tax (the 2020 ruling). The graveyard permission is per Karador: a new
// Karador that turn grants a fresh cast (also a ruling), and the spell keeps
// its own timing.
export default defineCard({
  name: "Karador, Ghost Chieftain",
  manaCost: "{5}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Centaur", "Spirit"],
  power: 3,
  toughness: 4,
  text:
    "This spell costs {1} less to cast for each creature card in your graveyard.\n" +
    "Once during each of your turns, you may cast a creature spell from your graveyard.",
  selfCostReduction: {
    // Unconditional: the same always-true gate Blasphemous Act uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { cardsInGraveyard: { type: "creature" } },
  },
  static: [
    {
      affects: { scope: "self" },
      castFromGraveyard: { filter: { type: "creature" }, oncePerTurn: true, yourTurnOnly: true },
      text: "Once during each of your turns, you may cast a creature spell from your graveyard.",
    },
  ],
});
