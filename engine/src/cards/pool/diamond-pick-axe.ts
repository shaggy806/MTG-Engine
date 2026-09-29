import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT = "Whenever this creature attacks, create a Treasure token.";
const PUMP_TEXT = `Equipped creature gets +1/+1 and has "${ATTACK_TEXT}"`;

export default defineCard({
  name: "Diamond Pick-Axe",
  manaCost: "{R}",
  colors: ["R"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["indestructible"],
  text:
    'Indestructible (Effects that say "destroy" don\'t destroy this Equipment.)\n' +
    `${PUMP_TEXT} (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")\n` +
    "Equip {2}",
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantsTriggered: [
        {
          trigger: { on: "attacks", who: "self" },
          targets: [],
          effect: { kind: "create-token", token: "Treasure Token", count: 1 },
          resolve: null,
          text: ATTACK_TEXT,
        },
      ],
      text: PUMP_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
