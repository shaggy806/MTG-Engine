import { defineCard } from "../define.js";

const PUMP_TEXT = "Enchanted creature gets +2/+2 and is goaded.";
const ATTACK_TEXT = "Whenever enchanted creature attacks, you create a Treasure token.";

export default defineCard({
  name: "Shiny Impetus",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    `Enchant creature\n${PUMP_TEXT} (It attacks each combat if able and attacks a player other than you if able.)\n` +
    `${ATTACK_TEXT} (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")`,
  targets: ["creature"],
  static: [
    { affects: { scope: "attached" }, grantPt: [2, 2], goads: true, text: PUMP_TEXT },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
