import { defineCard } from "../define.js";

export default defineCard({
  name: "Spectral Reserves",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create two 1/1 white Spirit creature tokens with flying. You gain 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Spirit Token", count: 2 },
      { kind: "gain-life", amount: 2 },
    ],
  },
});
