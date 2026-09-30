import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const STATIC_TEXT = "Equipped creature gets +2/+2 and has protection from red and from green.";
const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, exile the top two cards of your library. You may play those cards this turn. You may play an additional land this turn.";

export default defineCard({
  name: "Sword of Forge and Frontier",
  manaCost: "{3}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { colors: ["R", "G"] },
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "impulse-exile", amount: 2, duration: "end-of-turn" },
          { kind: "additional-land-drop", amount: 1 },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
