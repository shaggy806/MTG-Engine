import { defineCard } from "../define.js";

export default defineCard({
  name: "Awaken the Woods",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Create X 1/1 green Forest Dryad land creature tokens. (They're affected by summoning sickness.)",
  effect: { kind: "create-token", token: "Forest Dryad Token", count: "x" },
});
