import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT = "Whenever equipped creature deals combat damage to a player, draw a card, then discard a card.";

export default defineCard({
  name: "Zephyr Boots",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Equipped creature has flying.\n" +
    `${DAMAGE_TEXT}\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)`,
  static: [{ affects: { scope: "attached" }, grantKeywords: ["flying"], text: "Equipped creature has flying." }],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
