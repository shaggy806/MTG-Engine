import { defineCard } from "../define.js";

// EDHREC rank 3013.
//
// Rulings:
//   [2023-09-01] For Syr Ginger's last ability, use its power from when it was last on the
//     battlefield to determine how much life is gained. If that power was 0 or less, you gain no
//     life.
//
// "Put into a graveyard from the battlefield" is "dies" for any permanent (rule 700.4 —
// Marionette Master's shape). `powerOf: "source"` after the sacrifice reads last-known
// information (Wall of Limbs), and an amount is clamped at 0 (the ruling).
const KEYWORD_TEXT =
  "Syr Ginger has trample, hexproof, and haste as long as an opponent controls a planeswalker.";
const ARTIFACT_TEXT =
  "Whenever another artifact you control is put into a graveyard from the battlefield, put a +1/+1 counter on Syr Ginger and scry 1.";
const SAC_TEXT = "{2}, {T}, Sacrifice Syr Ginger: You gain life equal to its power.";

export default defineCard({
  name: "Syr Ginger, the Meal Ender",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Food", "Knight"],
  power: 3,
  toughness: 1,
  text: `${KEYWORD_TEXT}\n${ARTIFACT_TEXT}\n${SAC_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "opponent-controls", filter: { type: "planeswalker" }, atLeast: 1 },
      grantKeywords: ["trample", "hexproof", "haste"],
      text: KEYWORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "artifact" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "scry", amount: 1 },
        ],
      },
      resolve: null,
      text: ARTIFACT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: { powerOf: "source" } },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
