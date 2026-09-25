import { defineCard } from "../define.js";

export default defineCard({
  name: "Talrand's Invocation",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Create two 2/2 blue Drake creature tokens with flying.",
  effect: { kind: "create-token", token: "Drake Token", count: 2 },
});
