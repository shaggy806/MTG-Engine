import { defineCard } from "../define.js";

export default defineCard({
  name: "Akoum Hellkite",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Landfall — Whenever a land you control enters, this creature deals 1 damage to any target. If that land is a Mountain, this creature deals 2 damage instead.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["any-target"],
      // "If that land is a Mountain" asks about the permanent that fired the
      // trigger, not the board — hence the `trigger-object` condition.
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { subtype: "Mountain" } },
        then: { kind: "damage", amount: 2, target: 0 },
        else: { kind: "damage", amount: 1, target: 0 },
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature deals 1 damage to any target. If that land is a Mountain, this creature deals 2 damage instead.",
    },
  ],
});
