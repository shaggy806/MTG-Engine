import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Rally",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Create four 1/1 red Goblin creature tokens.",
  effect: { kind: "create-token", token: "Goblin Token", count: 4 },
});
