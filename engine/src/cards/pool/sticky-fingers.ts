import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

const GRANTED: TriggeredAbility = {
  trigger: { on: "deals-combat-damage-to-player", who: "self" },
  targets: [],
  effect: { kind: "create-token", token: "Treasure Token", count: 1 },
  resolve: null,
  text: "Whenever this creature deals combat damage to a player, create a Treasure token.",
};
const DIES_TEXT = "When enchanted creature dies, draw a card.";

// The Treasure trigger is the creature's own (granted), so its controller
// makes the Treasure; the draw on its death is Sticky Fingers' controller's.
export default defineCard({
  name: "Sticky Fingers",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Enchant creature\n" +
    'Enchanted creature has menace and "Whenever this creature deals combat damage to a player, create a Treasure token." ' +
    "(It can't be blocked except by two or more creatures. The token is an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\n" +
    DIES_TEXT,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["menace"],
      grantsTriggered: [GRANTED],
      text: 'Enchanted creature has menace and "Whenever this creature deals combat damage to a player, create a Treasure token."',
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
