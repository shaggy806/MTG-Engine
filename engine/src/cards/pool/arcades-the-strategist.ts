import { defineCard } from "../define.js";

// Commander backlog #46 (top-commanders.txt).
//
// - The last ability is one static on "each creature you control with
//   defender": the keyword narrowing reads current keywords, so a creature
//   given defender counts and one that lost its abilities doesn't.
// - It changes only how much combat damage those creatures assign, never
//   their power (2021-03-19 ruling) — `combatDamageByToughness` resizes
//   combat damage alone, so a fight or "damage equal to its power" still
//   reads the real power.
// - A defender that attacked stays attacking if Arcades leaves, and then
//   assigns damage equal to its power again (2021-03-19 ruling): the static
//   is read live, and nothing removes an attacker once declared.
export default defineCard({
  name: "Arcades, the Strategist",
  manaCost: "{1}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 3,
  toughness: 5,
  keywords: ["flying", "vigilance"],
  text:
    "Flying, vigilance\n" +
    "Whenever a creature you control with defender enters, draw a card.\n" +
    "Each creature you control with defender assigns combat damage equal to its toughness " +
    "rather than its power and can attack as though it didn't have defender.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "creature", controlledBy: "you", keyword: "defender" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a creature you control with defender enters, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", withKeyword: "defender" },
      combatDamageByToughness: "always",
      canAttackAsThoughNoDefender: true,
      text:
        "Each creature you control with defender assigns combat damage equal to its toughness " +
        "rather than its power and can attack as though it didn't have defender.",
    },
  ],
});
