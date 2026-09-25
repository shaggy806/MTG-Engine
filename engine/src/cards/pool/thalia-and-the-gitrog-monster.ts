import { defineCard } from "../define.js";

// #208 in top-commanders.txt.
//
// The attack trigger's draw waits for the sacrifice to be chosen (a
// `sequence` step that raises a decision is answered before the next).
const LAND_TEXT = "You may play an additional land on each of your turns.";
const TAPPED_TEXT = "Creatures and nonbasic lands your opponents control enter tapped.";
const ATTACK_TEXT = "Whenever Thalia and The Gitrog Monster attacks, sacrifice a creature or land, then draw a card.";

export default defineCard({
  name: "Thalia and The Gitrog Monster",
  manaCost: "{1}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Frog", "Horror"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike", "deathtouch"],
  text: `First strike, deathtouch\n${LAND_TEXT}\n${TAPPED_TEXT}\n${ATTACK_TEXT}`,
  static: [
    { affects: { scope: "self" }, extraLandsPerTurn: 1, text: LAND_TEXT },
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: {
          controlledBy: "opponent",
          anyOf: [{ type: "creature" }, { type: "land", notSupertype: "basic" }],
        },
        tapped: true,
      },
      text: TAPPED_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice", who: "you", filter: { typesAnyOf: ["creature", "land"] }, count: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
