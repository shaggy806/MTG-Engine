import { defineCard } from "../define.js";

export default defineCard({
  name: "Tyrant's Familiar",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "haste"],
  text:
    "Flying, haste\n" +
    'Lieutenant — As long as you control your commander, this creature gets +2/+2 and has "Whenever this creature attacks, it deals 7 damage to target creature defending player controls."',
  static: [
    {
      affects: { scope: "self" },
      // Lieutenant is just a condition on controlling your own commander —
      // `CardFilter.isCommander` already expresses it.
      condition: {
        kind: "controls",
        filter: { isCommander: true, controlledBy: "you" },
        atLeast: 1,
      },
      grantPt: [2, 2],
      grantsTriggered: [
        {
          trigger: { on: "attacks", who: "self" },
          targets: ["creature-defending-player-controls"],
          effect: { kind: "damage", amount: 7, target: 0 },
          resolve: null,
          text: "Whenever this creature attacks, it deals 7 damage to target creature defending player controls.",
        },
      ],
      text: 'Lieutenant — As long as you control your commander, this creature gets +2/+2 and has "Whenever this creature attacks, it deals 7 damage to target creature defending player controls."',
    },
  ],
});
