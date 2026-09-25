import { defineCard } from "../define.js";

export default defineCard({
  name: "Ticked Off",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Target creature gains double strike until end of turn. (It deals both first-strike and regular combat damage.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
});
