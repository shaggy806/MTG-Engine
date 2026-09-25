import { defineCard } from "../define.js";

export default defineCard({
  name: "Zada's Commando",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Archer", "Ally"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\nCohort — {T}, Tap an untapped Ally you control: This creature deals 1 damage to target opponent or planeswalker.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { subtype: "Ally", controlledBy: "you" } },
      },
      targets: ["opponent-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Cohort — {T}, Tap an untapped Ally you control: This creature deals 1 damage to target opponent or planeswalker.",
    },
  ],
});
