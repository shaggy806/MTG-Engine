import { defineCard } from "../define.js";

// Felothar the Steadfast's two statics on an enchantment. The first changes
// only how much combat damage your creatures assign, never their power (the
// 2019-01-25 ruling — a fight still uses power).
export default defineCard({
  name: "High Alert",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["enchantment"],
  text:
    "Each creature you control assigns combat damage equal to its toughness rather than its power.\n" +
    "Creatures you control can attack as though they didn't have defender.\n" +
    "{2}{W}{U}: Untap target creature.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      combatDamageByToughness: "always",
      text:
        "Each creature you control assigns combat damage equal to its toughness rather than its power.",
    },
    {
      affects: { scope: "creatures-you-control" },
      canAttackAsThoughNoDefender: true,
      text: "Creatures you control can attack as though they didn't have defender.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{W}{U}", tap: false },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{2}{W}{U}: Untap target creature.",
    },
  ],
});
