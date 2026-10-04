import { defineCard } from "../define.js";

// EDHREC rank 6257.

export default defineCard({
  name: "Geosurge",
  manaCost: "{R}{R}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Add {R}{R}{R}{R}{R}{R}{R}. Spend this mana only to cast artifact or creature spells.",
  effect: {
    kind: "add-mana",
    mana: "R",
    amount: 7,
    spendOnly: {
      spell: { typesAnyOf: ["artifact", "creature"] },
      text: "Spend this mana only to cast artifact or creature spells.",
    },
  },
});
