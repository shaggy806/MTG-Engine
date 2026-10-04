import { defineCard } from "../define.js";

// EDHREC rank 6396.
// The sacrificed Goblin needn't be a creature (2011-09-22 ruling): the
// filter is the subtype alone.

export default defineCard({
  name: "Goblin Grenade",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a Goblin.\nGoblin Grenade deals 5 damage to any target.",
  additionalCost: { sacrifice: { subtype: "Goblin", controlledBy: "you" } },
  targets: ["any-target"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
