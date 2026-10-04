import { defineCard } from "../define.js";

// EDHREC rank 4604.
//
// Rulings:
//   [2024-03-08] If the creature Grim Reaper's Sprint would enchant is an illegal target by the
//     time Grim Reaper's Sprint would resolve, the entire spell doesn't resolve. It's put into the
//     graveyard from the stack, so its triggered ability won't trigger, and you won't untap your
//     creatures or get an additional combat phase.

export default defineCard({
  name: "Grim Reaper's Sprint",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Morbid — This spell costs {3} less to cast if a creature died this turn.\nEnchant creature\nWhen this Aura enters, untap each creature you control. If it's your main phase, there is an additional combat phase after this phase.\nEnchanted creature gets +2/+2 and has haste.",
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Tifa, Martial Artist's untap + extra combat; "your main phase" is
      // Return to Dust's main-phase steps on your own turn.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
          {
            kind: "conditional",
            condition: {
              kind: "all",
              of: [{ kind: "your-turn" }, { kind: "turn-structure", steps: ["precombat-main", "postcombat-main"] }],
            },
            then: { kind: "additional-combat", afterThisPhase: true },
          },
        ],
      },
      resolve: null,
      text: "When this Aura enters, untap each creature you control. If it's your main phase, there is an additional combat phase after this phase.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["haste"],
      text: "Enchanted creature gets +2/+2 and has haste.",
    },
  ],
  selfCostReduction: { condition: { kind: "creature-died-this-turn" }, reduceGeneric: 3 },
});
