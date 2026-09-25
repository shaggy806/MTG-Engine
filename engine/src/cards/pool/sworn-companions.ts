import { defineCard } from "../define.js";

export default defineCard({
  name: "Sworn Companions",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create two 1/1 white Soldier creature tokens with lifelink.",
  effect: { kind: "create-token", token: "Lifelink Soldier Token", count: 2 },
});
