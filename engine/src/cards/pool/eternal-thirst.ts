import { defineCard } from "../define.js";

// EDHREC rank 5918.
//
// Rulings:
//   [2017-11-17] If the enchanted creature is dealt lethal damage at the same time as a creature
//     an opponent controls, they’re destroyed at the same time. It won’t receive a +1/+1 counter
//     from its ability in time to save it.
//   [2017-11-17] Multiple instances of lifelink on the same creature are redundant.

export default defineCard({
  name: "Eternal Thirst",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has lifelink and \"Whenever a creature an opponent controls dies, put a +1/+1 counter on this creature.\" (Damage dealt by a creature with lifelink also causes its controller to gain that much life.)",
  targets: ["creature"],
  static: [
    {
      // Light of Promise's granted-trigger shape; the dies filter is Malakir
      // Cullblade's, read from the enchanted creature's controller's side.
      affects: { scope: "attached" },
      grantKeywords: ["lifelink"],
      grantsTriggered: [
        {
          trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
          targets: [],
          effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          resolve: null,
          text: "Whenever a creature an opponent controls dies, put a +1/+1 counter on this creature.",
        },
      ],
      text: "Enchanted creature has lifelink and \"Whenever a creature an opponent controls dies, put a +1/+1 counter on this creature.\"",
    },
  ],
});
