import { defineCard } from "../define.js";

/**
 * Top-commanders rank 115.
 *
 * The extra land drop (rule 305.2) is the `extraLandsPerTurn` static
 * Exploration and Oracle of Mul Daya use: `Game.maxLandsFor` folds it into
 * its controller's land-drop budget only while Aesi is on the battlefield,
 * and it stacks with any other such effect (the 2020-11-10 ruling). Lands are
 * only ever played on your own turn (rule 305.1), so "on each of your turns"
 * needs nothing more.
 *
 * Landfall fires on a land entering under your control by any means — played,
 * or put onto the battlefield by a spell or ability — but not on a permanent
 * already there becoming a land (the 2024-11-08 rulings): `enters-battlefield`
 * is a zone-change trigger, not a type-change one. The draw is optional
 * (rule 603.5 — "you may" is chosen as the ability resolves).
 */
export default defineCard({
  name: "Aesi, Tyrant of Gyre Strait",
  manaCost: "{4}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 5,
  toughness: 5,
  text:
    "You may play an additional land on each of your turns.\n" +
    "Landfall — Whenever a land you control enters, you may draw a card.",
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: "You may play an additional land on each of your turns.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "land" },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw a card?",
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you may draw a card.",
    },
  ],
});
