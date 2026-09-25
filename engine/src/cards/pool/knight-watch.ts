import { defineCard } from "../define.js";

export default defineCard({
  name: "Knight Watch",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create two 2/2 white Knight creature tokens with vigilance.",
  effect: { kind: "create-token", token: "Knight Token", count: 2 },
});
