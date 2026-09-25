import { defineCard } from "../define.js";

export default defineCard({
  name: "Shadow Summoning",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text: "Create two tapped 1/1 white Spirit creature tokens with flying.",
  effect: { kind: "create-token", token: "Spirit Token", count: 2, tapped: true },
});
