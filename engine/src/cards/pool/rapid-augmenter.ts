import { defineCard } from "../define.js";

// Base power (rulings): printed, or what an effect or a characteristic-
// defining ability sets — a modification doesn't change it. "If it wasn't
// cast" can't change between the trigger and its resolution, so it's the
// trigger's filter (a token, a reanimated or blinked creature, one put onto
// the battlefield by an effect).
const HASTE_TEXT =
  "Whenever another creature you control with base power 1 enters, it gains haste until end of turn.";
const COUNTER_TEXT =
  "Whenever another creature you control enters, if it wasn't cast, put a +1/+1 counter on this creature and this creature can't be blocked this turn.";

export default defineCard({
  name: "Rapid Augmenter",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Otter", "Artificer"],
  power: 1,
  toughness: 3,
  keywords: ["haste"],
  text: `Haste\n${HASTE_TEXT}\n${COUNTER_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", basePower: { op: "eq", n: 1 } },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "grant-keyword", target: "trigger-object", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: HASTE_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", cast: false },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "grant-keyword", target: "source", keyword: "unblockable", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
