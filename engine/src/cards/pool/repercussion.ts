import { defineCard } from "../define.js";

// EDHREC rank 2989.
//
// "That creature's controller" is the `trigger-player` of a `dealt-damage`
// trigger: the damaged permanent's controller as the damage is dealt, so a
// creature the damage kills still names who controlled it. Damage dealt to one
// creature by several sources at once (combat) is one event, one trigger.

const TEXT =
  "Whenever a creature is dealt damage, this enchantment deals that much damage to that creature's controller.";

export default defineCard({
  name: "Repercussion",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "damage", amount: { triggerValue: true }, who: "trigger-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});
