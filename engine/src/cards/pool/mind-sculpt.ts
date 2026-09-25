import { defineCard } from "../define.js";

export default defineCard({
  name: "Mind Sculpt",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target opponent mills seven cards.",
  targets: ["opponent"],
  effect: { kind: "mill", target: 0, amount: 7 },
});
