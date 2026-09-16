import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragonkin Berserker",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Berserker"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text:
    "First strike\n" +
    "Boast abilities you activate cost {1} less to activate for each Dragon you control.\n" +
    "Boast — {4}{R}: Create a 5/5 red Dragon creature token with flying. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: { mana: "{4}{R}", tap: false },
      // `boast` covers both halves of rule 702.135: attacked this turn, and
      // only once each turn.
      boast: true,
      // The card's own cost-reduction clause, which on this card only ever
      // applies to its own Boast ability.
      costReduction: {
        reduceGeneric: { countOf: { subtype: "Dragon", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 1 },
      resolve: null,
      text: "Boast — {4}{R}: Create a 5/5 red Dragon creature token with flying.",
    },
  ],
});
