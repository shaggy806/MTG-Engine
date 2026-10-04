import { defineCard } from "../define.js";

// EDHREC rank 6427.
// Makes Saproling → use "Saproling Token".
//
// Rulings:
//   [2006-09-25] The token is put onto the battlefield under the control of the player who
//     controls the enchanted creature, not the player who controls Verdant Embrace.

const GRANTED_TEXT = "At the beginning of each upkeep, create a 1/1 green Saproling creature token.";
const TEXT = `Enchanted creature gets +3/+3 and has "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Verdant Embrace",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [3, 3],
      // The granted ability is the enchanted creature's own, so its
      // controller makes the token.
      grantsTriggered: [
        {
          trigger: { on: "step-begins", step: "upkeep", who: "any" },
          targets: [],
          effect: { kind: "create-token", token: "Saproling Token", count: 1 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
