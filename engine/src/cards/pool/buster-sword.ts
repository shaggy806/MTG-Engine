import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// Glamdring's trigger with a draw first: the draw, then the free cast from
// hand while the ability resolves (rule 608.2g; its ruling — not later in the
// turn, timing ignored), of any spell — a permanent spell too — whose mana
// value at X = 0 (rule 107.3b, its ruling) is at most the damage the creature
// dealt (the trigger's value). The card just drawn may be the one cast.
const PT_TEXT = "Equipped creature gets +3/+2.";
const TRIGGER_TEXT =
  "Whenever equipped creature deals combat damage to a player, draw a card, then you may cast a spell from " +
  "your hand with mana value less than or equal to that damage without paying its mana cost.";

export default defineCard({
  name: "Buster Sword",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${PT_TEXT}\n${TRIGGER_TEXT}\nEquip {2}`,
  activated: [equip("{2}")],
  static: [{ affects: { scope: "attached" }, grantPt: [3, 2], text: PT_TEXT }],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "cast-now",
            from: "hand",
            free: true,
            spell: { manaValue: { op: "lte", n: { amount: { triggerValue: true } } } },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
