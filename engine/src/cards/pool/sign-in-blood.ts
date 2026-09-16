import { defineCard } from "../define.js";

// "Target player" — you may point this at yourself, which is most of why the
// card is played, so the spec is `"player"` rather than `"opponent"`.
export default defineCard({
  name: "Sign in Blood",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target player draws two cards and loses 2 life.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2, target: 0 },
      { kind: "lose-life", amount: 2, target: 0 },
    ],
  },
});
