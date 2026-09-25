import { defineCard } from "../define.js";

// - The doubling is `doubleTriggers` keyed on a creature dying: its own dies
//   and leaves-the-battlefield triggers, and every other trigger its death
//   causes. "Whenever you sacrifice a creature" isn't caused by the dying,
//   and isn't doubled (2019-01-25 ruling).
// - A creature dying at the same time as Teysa, Teysa included, still
//   triggers twice (ruling): a death looks back at the doublers that left
//   with it.
const DOUBLE_TEXT =
  "If a creature dying causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.";
const TOKENS_TEXT = "Creature tokens you control have vigilance and lifelink.";

export default defineCard({
  name: "Teysa Karlov",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 2,
  toughness: 4,
  text: `${DOUBLE_TEXT}\n${TOKENS_TEXT}`,
  static: [
    { affects: { scope: "self" }, doubleTriggers: { cause: "dies", filter: { type: "creature" } }, text: DOUBLE_TEXT },
    {
      affects: { scope: "creatures-you-control", tokenOnly: true },
      grantKeywords: ["vigilance", "lifelink"],
      text: TOKENS_TEXT,
    },
  ],
});
