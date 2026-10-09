import { defineCard } from "../define.js";

/** 1/1 red Devil with "When this token dies, it deals 1 damage to any
 * target" — Zariel, Archduke of Avernus's token. */
export default defineCard({
  name: "Devil Token",
  art: "efbc2ca1-4aad-4dfa-9eab-e783f5802078",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 1,
  toughness: 1,
  text: "When this token dies, it deals 1 damage to any target.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "When this token dies, it deals 1 damage to any target.",
    },
  ],
});
