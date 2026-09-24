import { defineCard } from "../define.js";

// Commander backlog #72 (top-commanders.txt).
//
// - The first ability changes only how much combat damage your creatures
//   assign, never their power (2025-04-04 ruling) — so the activated ability's
//   "discard cards equal to its power" reads the sacrificed creature's real
//   power, not its toughness.
// - "Sacrifice another creature": `otherOnly` keeps Felothar out of its own
//   cost. The sacrificed creature's toughness and power are read as it last
//   existed on the battlefield (rule 608.2h), anthems and counters included;
//   a negative value draws or discards nothing.
export default defineCard({
  name: "Felothar the Steadfast",
  manaCost: "{1}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 0,
  toughness: 5,
  text:
    "Each creature you control assigns combat damage equal to its toughness rather than its power.\n" +
    "Creatures you control can attack as though they didn't have defender.\n" +
    "{3}, {T}, Sacrifice another creature: Draw cards equal to the sacrificed creature's " +
    "toughness, then discard cards equal to its power.",
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
      cost: {
        mana: "{3}",
        tap: true,
        sacrifice: { filter: { type: "creature", controlledBy: "you" } },
      },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: { toughnessOf: "sacrificed" } },
          { kind: "discard", target: "you", amount: { powerOf: "sacrificed" } },
        ],
      },
      resolve: null,
      text:
        "{3}, {T}, Sacrifice another creature: Draw cards equal to the sacrificed creature's " +
        "toughness, then discard cards equal to its power.",
    },
  ],
});
