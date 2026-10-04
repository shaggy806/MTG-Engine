import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 3465.
//
// Rulings:
//   [2023-06-16] If the equipped creature is legendary, Andúril's controller chooses which player,
//     planeswalker, or battle the Spirit tokens are attacking. Each Spirit token can enter
//     attacking a different player, planeswalker, or battle, and they don't need to be the same
//     player, planeswalker, or battle that the equipped creature is attacking.
//   [2023-06-16] If Andúril is equipped to a creature an opponent controls, Andúril's controller
//     will create two tapped Spirit tokens each time that creature attacks. Even if that creature
//     is legendary, the Spirits would not enter the battlefield attacking.
//
// `attacking: "choose"` asks for each token's defender; only tokens under the
// attacking player enter attacking at all (rule 506.3), which is the second
// ruling. "That creature" is the trigger object, read as the trigger resolves.

const ATTACK_TEXT =
  "Whenever equipped creature attacks, create two tapped 1/1 white Spirit creature tokens with flying. " +
  "If that creature is legendary, instead create two of those tokens that are tapped and attacking.";

export default defineCard({
  name: "Andúril, Flame of the West",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +3/+1.\n${ATTACK_TEXT}\nEquip {2}`,
  static: [{ affects: { scope: "attached" }, grantPt: [3, 1], text: "Equipped creature gets +3/+1." }],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { supertype: "legendary" } },
        then: { kind: "create-token", token: "Spirit Token", count: 2, tapped: true, attacking: "choose" },
        else: { kind: "create-token", token: "Spirit Token", count: 2, tapped: true },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
