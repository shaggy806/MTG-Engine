import { defineCard } from "../define.js";

export default defineCard({
  name: "Root Out",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Destroy target artifact or enchantment.\nInvestigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: ["artifact-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "create-token", token: "Clue Token", count: 1 }],
  },
});
