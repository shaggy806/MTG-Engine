import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #361 in top-commanders.txt.
//
// "You may pay {W}{B} and 2 life. When you do, …" — a `may` whose cost is
// mana and life together, with a reflexive trigger that targets once it's paid.
const BAT_TEXT = "Whenever a Bat you control attacks, you gain 1 life.";
const RETURN_TEXT =
  "When you do, return target nonland permanent card with mana value 3 or less from your graveyard " +
  "to the battlefield with a finality counter on it.";
const ZORALINE_TEXT = `Whenever Zoraline enters or attacks, you may pay {W}{B} and 2 life. ${RETURN_TEXT}`;
const payAndReturn: EffectSpec = {
  kind: "may",
  prompt: "Pay {W}{B} and 2 life to return a nonland permanent card with mana value 3 or less?",
  cost: "{W}{B}",
  costLife: 2,
  effect: {
    kind: "reflexive-trigger",
    targets: [
      {
        kind: "card-in-graveyard",
        whose: "you",
        filter: {
          typesAnyOf: ["artifact", "creature", "enchantment", "planeswalker", "battle"],
          manaValue: { op: "lte", n: 3 },
        },
      },
    ],
    effect: { kind: "put-onto-battlefield", target: 0, withCounters: { kind: "finality", amount: 1 } },
    text: RETURN_TEXT,
  },
};

export default defineCard({
  name: "Zoraline, Cosmos Caller",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bat", "Cleric"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${BAT_TEXT}\n${ZORALINE_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Bat" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: BAT_TEXT,
    },
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: payAndReturn, resolve: null, text: ZORALINE_TEXT },
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: payAndReturn, resolve: null, text: ZORALINE_TEXT },
  ],
});
