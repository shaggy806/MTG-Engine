import { defineCard } from "../define.js";

// EDHREC rank 5520.
//
// Rulings:
//   [2004-10-04] It affects all players, including you.
//
// Ruric Thar's shape without the noncreature narrowing: "that player" is the
// caster (`"trigger-controller"`), not a target.
const TEXT = "Whenever a player casts a spell, this enchantment deals 2 damage to that player.";

export default defineCard({
  name: "Spellshock",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any" },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: TEXT,
    },
  ],
});
