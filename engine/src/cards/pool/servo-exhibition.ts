import { defineCard } from "../define.js";

export default defineCard({
  name: "Servo Exhibition",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create two 1/1 colorless Servo artifact creature tokens.",
  effect: { kind: "create-token", token: "Servo Token", count: 2 },
});
