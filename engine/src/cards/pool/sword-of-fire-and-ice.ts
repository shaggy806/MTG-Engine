import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, this Equipment deals 2 damage to any target and you draw a card.";

// The Equipment deals the 2 (it's the ability's source); an illegal target
// on resolution means no card either (the ruling — the ability fizzles).
export default defineCard({
  name: "Sword of Fire and Ice",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +2/+2 and has protection from red and from blue.\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { colors: ["R", "U"] },
      text: "Equipped creature gets +2/+2 and has protection from red and from blue.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: ["any-target"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 2, target: 0 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
