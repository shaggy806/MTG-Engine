import { defineCard } from "../define.js";

// The first ability changes only how much combat damage your creatures
// assign, never their power (2017-11-17 ruling).
export default defineCard({
  name: "Assault Formation",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "Each creature you control assigns combat damage equal to its toughness rather than its power.\n" +
    "{G}: Target creature with defender can attack this turn as though it didn't have defender.\n" +
    "{2}{G}: Creatures you control get +0/+1 until end of turn.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      combatDamageByToughness: "always",
      text:
        "Each creature you control assigns combat damage equal to its toughness rather than its power.",
    },
  ],
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [{ kind: "permanent", filter: { type: "creature", keyword: "defender" } }],
      effect: { kind: "attack-despite-defender", target: 0 },
      resolve: null,
      text: "{G}: Target creature with defender can attack this turn as though it didn't have defender.",
    },
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 0,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{G}: Creatures you control get +0/+1 until end of turn.",
    },
  ],
});
