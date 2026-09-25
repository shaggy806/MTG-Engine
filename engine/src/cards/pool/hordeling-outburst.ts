import { defineCard } from "../define.js";

export default defineCard({
  name: "Hordeling Outburst",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Create three 1/1 red Goblin creature tokens.",
  effect: { kind: "create-token", token: "Goblin Token", count: 3 },
});
