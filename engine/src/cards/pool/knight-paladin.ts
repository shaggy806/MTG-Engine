import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";

// EDHREC rank 5864. "Rapid-fire Battle Cannon" is a flavor word: no rules
// meaning of its own.
const CANNON = "Rapid-fire Battle Cannon — When this Vehicle enters, it deals 4 damage to each opponent.";

export default defineCard({
  name: "Knight Paladin",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: `Trample\n${CANNON}\n${crewText(1)}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "damage", amount: 4, who: "each-opponent" },
      resolve: null,
      text: CANNON,
    },
  ],
  activated: [crew(1, crewText(1))],
});
