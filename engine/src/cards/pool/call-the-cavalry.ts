import { defineCard } from "../define.js";

export default defineCard({
  name: "Call the Cavalry",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create two 2/2 white Knight creature tokens with vigilance.",
  effect: { kind: "create-token", token: "Knight Token", count: 2 },
});
