import { defineCard } from "../define.js";

export default defineCard({
  name: "Queen's Commission",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create two 1/1 white Vampire creature tokens with lifelink.",
  effect: { kind: "create-token", token: "Lifelink Vampire Token", count: 2 },
});
