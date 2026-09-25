import { defineCard } from "../define.js";

export default defineCard({
  name: "Trail of Evidence",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever you cast an instant or sorcery spell, investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, investigate.",
    },
  ],
});
