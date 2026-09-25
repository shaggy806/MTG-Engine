import { defineCard } from "../define.js";

export default defineCard({
  name: "Krenko's Command",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Create two 1/1 red Goblin creature tokens.",
  effect: { kind: "create-token", token: "Goblin Token", count: 2 },
});
