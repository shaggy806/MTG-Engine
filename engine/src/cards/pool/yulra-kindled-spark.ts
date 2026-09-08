import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-5 — a planeswalker with a **triggered ability** (an
 * upkeep trigger that targets). `detectTriggers` scans every battlefield
 * object's `triggered` list, and the trigger flows onto the stack through the
 * normal `choose-targets` decision (EG-1) — a planeswalker source needs no
 * special-casing. Made-up.
 */
export default defineCard({
  name: "Yulra, Kindled Spark",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Yulra"],
  loyalty: 3,
  text:
    "At the beginning of your upkeep, Yulra, Kindled Spark deals 1 damage to any target.\n" +
    "[+1]: Yulra, Kindled Spark deals 2 damage to target creature.\n" +
    "[-2]: Draw a card.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "At the beginning of your upkeep, Yulra, Kindled Spark deals 1 damage to any target.",
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "[+1]: Yulra, Kindled Spark deals 2 damage to target creature.",
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "[-2]: Draw a card.",
    },
  ],
});
