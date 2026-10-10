import { defineCard } from "../define.js";

// EDHREC rank 1144.
const TEMPT = "When this enchantment enters, the Ring tempts you.";
const BURN = "Whenever you cast an instant or sorcery spell, this enchantment deals 2 damage to each opponent.";

export default defineCard({
  name: "Fiery Inscription",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${TEMPT}\n${BURN}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "the-ring-tempts-you" },
      resolve: null,
      text: TEMPT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text: BURN,
    },
  ],
});
