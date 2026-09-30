import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const TEXT = "At the beginning of your first main phase, add {G}{G}.";

// "Your first main phase" is the precombat main — not an additional one.
export default defineCard({
  name: "Hulking Raptor",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 5,
  toughness: 3,
  text: `Ward {2}\n${TEXT}`,
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      text: TEXT,
    },
  ],
});
