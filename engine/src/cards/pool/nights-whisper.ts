import { defineCard } from "../define.js";

export default defineCard({
  name: "Night's Whisper",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "You draw two cards and lose 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "lose-life", amount: 2, who: "you" },
    ],
  },
});
