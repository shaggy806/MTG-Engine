import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const STATIC = "Equipped creature gets +2/+0 and has deathtouch.";
const GRANTED = "Whenever equipped creature deals combat damage to a player, that player loses the game.";
const ACTIVATE = `{5}{B}{B}{B}: Until end of turn, this Equipment gains "${GRANTED}"`;

// The Equipment gains the ability itself (a modifier on it, gone at cleanup or
// if it changes zones), and it watches whatever creature it's attached to
// when the damage is dealt. "That player" is the one dealt the damage; one
// who can't lose the game (Platinum Angel) doesn't.
export default defineCard({
  name: "Vorpal Sword",
  manaCost: "{B}",
  colors: ["B"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC}\n${ACTIVATE}\nEquip {B}{B}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["deathtouch"],
      text: STATIC,
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{B}{B}{B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-triggered",
        target: "source",
        duration: "end-of-turn",
        ability: {
          trigger: { on: "deals-combat-damage-to-player", who: "attached" },
          targets: [],
          effect: { kind: "lose-game", who: "trigger-player" },
          resolve: null,
          text: GRANTED,
        },
      },
      resolve: null,
      text: ACTIVATE,
    },
    equip("{B}{B}"),
  ],
});
