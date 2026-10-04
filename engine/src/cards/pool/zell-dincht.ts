import { defineCard } from "../define.js";

// EDHREC rank 5530.
//
// Rulings:
//   [2025-06-06] The effect of Zell Dincht's first ability is cumulative with similar effects. For
//     example, if you control both Zell Dincht and Exploration (an enchantment with "You may play
//     an additional land on each of your turns"), you'll be able to play three lands during each
//     of your turns.
//
// The land drop is Dryad of the Ilysian Grove's static (cumulative); the
// bonus Multani's `grantPtPerCount`; the bounce Whitemane Lion's choice as
// it resolves (no target), returning one if you control any.

const LAND_TEXT = "You may play an additional land on each of your turns.";
const PT_TEXT = "Zell Dincht gets +1/+0 for each land you control.";
const END_TEXT = "At the beginning of your end step, return a land you control to its owner's hand.";

export default defineCard({
  name: "Zell Dincht",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 0,
  toughness: 3,
  text: `${LAND_TEXT}\n${PT_TEXT}\n${END_TEXT}`,
  static: [
    { affects: { scope: "self" }, extraLandsPerTurn: 1, text: LAND_TEXT },
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { type: "land", controlledBy: "you" }, pt: [1, 0] },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "choose-permanents",
        filter: { type: "land", controlledBy: "you" },
        min: 1,
        upTo: 1,
        then: { kind: "return-to-hand", target: 0 },
        prompt: "Return a land you control to its owner's hand",
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
