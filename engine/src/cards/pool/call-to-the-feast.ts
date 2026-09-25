import { defineCard } from "../define.js";

export default defineCard({
  name: "Call to the Feast",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text: "Create three 1/1 white Vampire creature tokens with lifelink.",
  effect: { kind: "create-token", token: "Lifelink Vampire Token", count: 3 },
});
