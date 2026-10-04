import { defineCard } from "../define.js";

// EDHREC rank 4923.
//
// Rulings:
//   [2020-04-17] Song of Creation's first ability is cumulative if you control more than one. It's
//     also cumulative with other effects that let you play additional lands, such as the one from
//     Dryad of the Ilysian Grove.
//   [2020-04-17] Players can cast spells and activate abilities after the first triggered ability
//     resolves but before the spell that caused it to trigger does.
//   [2020-04-17] Song of Creation's second ability doesn't trigger when you cast it because it's
//     not on the battlefield yet.
//   [2020-04-17] An ability that triggers when a player casts a spell resolves before the spell
//     that caused it to trigger. It resolves even if that spell is countered.

const LAND_TEXT = "You may play an additional land on each of your turns.";
const CAST_TEXT = "Whenever you cast a spell, draw two cards.";
const END_TEXT = "At the beginning of your end step, discard your hand.";

export default defineCard({
  name: "Song of Creation",
  manaCost: "{1}{G}{U}{R}",
  colors: ["U", "R", "G"],
  types: ["enchantment"],
  text: `${LAND_TEXT}\n${CAST_TEXT}\n${END_TEXT}`,
  static: [{ affects: { scope: "self" }, extraLandsPerTurn: 1, text: LAND_TEXT }],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: CAST_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "discard-hand", who: "you" },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
