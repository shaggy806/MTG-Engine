import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT = "Whenever equipped creature deals combat damage to a player, you may draw a card.";

export default defineCard({
  name: "Rogue's Gloves",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${DAMAGE_TEXT}\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
