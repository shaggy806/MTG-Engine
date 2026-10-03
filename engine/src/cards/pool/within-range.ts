import { defineCard } from "../define.js";

const ETB_TEXT = "When this enchantment enters, create two 1/1 red Warrior creature tokens.";
const ATTACK_TEXT = "Whenever you attack, each opponent loses life equal to the number of creatures attacking them.";

// "Attacking them": the creatures attacking that opponent as it resolves —
// not their planeswalkers (rule 506.3), and a token stack as each token.
export default defineCard({
  name: "Within Range",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${ETB_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Red Warrior Token", count: 2 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: { kind: "lose-life", who: "each-opponent", amount: { attackingPlayer: "each" } },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
