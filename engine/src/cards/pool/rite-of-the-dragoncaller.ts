import { defineCard } from "../define.js";

export default defineCard({
  name: "Rite of the Dragoncaller",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Whenever you cast an instant or sorcery spell, create a 5/5 red Dragon creature token with flying.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 1 },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, create a 5/5 red Dragon creature token with flying.",
    },
  ],
});
