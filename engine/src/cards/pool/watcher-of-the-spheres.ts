import { defineCard } from "../define.js";

// EDHREC rank 4352.
//
// Rulings:
//   [2020-06-23] The cost reduction applies only to generic mana in the cost of creature spells
//     with flying you cast. For example, if you cast a second Watcher of the Spheres, its cost
//     won't be reduced below {W}{U}.
//   [2020-06-23] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying, add any cost increases, then apply any cost reductions (such as that of
//     Watcher of the Spheres). The mana value of the spell remains unchanged, no matter what the
//     total cost to cast it was.
//   [2020-06-23] A creature spell that doesn't have flying won't cost less even if an effect will
//     cause the creature to have flying once on the battlefield. This is also true if the creature
//     spell itself has an ability that gives it flying once on the battlefield under certain
//     conditions, even if those conditions are true.

const COST_TEXT = "Creature spells with flying you cast cost {1} less to cast.";
const PUMP_TEXT = "Whenever another creature you control with flying enters, this creature gets +1/+1 until end of turn.";

export default defineCard({
  name: "Watcher of the Spheres",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${COST_TEXT}\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      // Warden of Evos Isle's shape.
      costModification: {
        applies: { type: "creature", keyword: "flying", controlledBy: "you" },
        reduceGeneric: 1,
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", keyword: "flying" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
