import { defineCard } from "../define.js";

export default defineCard({
  name: "Blasting Station",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}, Sacrifice a creature: This artifact deals 1 damage to any target.\nWhenever a creature enters, you may untap this artifact.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}, Sacrifice a creature: This artifact deals 1 damage to any target.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "may", prompt: "Untap ~?", effect: { kind: "untap", target: "source" } },
      resolve: null,
      text: "Whenever a creature enters, you may untap this artifact.",
    },
  ],
});
