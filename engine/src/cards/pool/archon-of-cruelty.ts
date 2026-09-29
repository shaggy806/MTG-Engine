import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

const TEXT =
  "Whenever this creature enters or attacks, target opponent sacrifices a creature or planeswalker of their choice, discards a card, and loses 3 life. You draw a card and gain 3 life.";

// In the order written: the sacrificed permanent is gone before they discard
// or lose life (the ruling).
const EFFECT: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "sacrifice", who: "target", filter: { typesAnyOf: ["creature", "planeswalker"] }, count: 1 },
    { kind: "discard", target: 0, amount: 1 },
    { kind: "lose-life", amount: 3, target: 0 },
    { kind: "draw", amount: 1 },
    { kind: "gain-life", amount: 3 },
  ],
};

export default defineCard({
  name: "Archon of Cruelty",
  manaCost: "{6}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Archon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: EFFECT,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["opponent"],
      effect: EFFECT,
      resolve: null,
      text: TEXT,
    },
  ],
});
