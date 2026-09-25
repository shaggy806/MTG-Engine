import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Offensive",
  manaCost: "{X}{1}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Create X 1/1 red Goblin creature tokens.",
  effect: { kind: "create-token", token: "Goblin Token", count: "x" },
});
