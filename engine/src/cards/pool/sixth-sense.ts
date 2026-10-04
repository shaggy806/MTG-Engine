import { defineCard } from "../define.js";

// EDHREC rank 6170.

const GRANTED_TEXT = "Whenever this creature deals combat damage to a player, you may draw a card.";
const STATIC_TEXT = `Enchanted creature has "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Sixth Sense",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${STATIC_TEXT}`,
  targets: ["creature"],
  static: [
    {
      // A granted ability: the enchanted creature's controller ("you" in the
      // quoted text) draws, whoever controls the Aura.
      affects: { scope: "attached" },
      grantsTriggered: [
        {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: STATIC_TEXT,
    },
  ],
});
