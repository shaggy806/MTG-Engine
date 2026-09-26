import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, you may draw two cards. If you do, discard a card.";

export default defineCard({
  name: "Mask of Memory",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${DAMAGE_TEXT}\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw two cards, then discard a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 2 },
            { kind: "discard", target: "you", amount: 1 },
          ],
        },
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{1}")],
});
