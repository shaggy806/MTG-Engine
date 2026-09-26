import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, that player discards a card and you untap all lands you control.";

// The lands untap even if that player has no card to discard (the ruling).
export default defineCard({
  name: "Sword of Feast and Famine",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +2/+2 and has protection from black and from green.\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { colors: ["B", "G"] },
      text: "Equipped creature gets +2/+2 and has protection from black and from green.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard", target: "trigger-player", amount: 1 },
          { kind: "untap-all", filter: { type: "land", controlledBy: "you" } },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
