import { defineCard } from "../define.js";

export default defineCard({
  name: "Double Cleave",
  manaCost: "{1}{R/W}",
  colors: ["W", "R"],
  types: ["instant"],
  text: "Target creature gains double strike until end of turn. (It deals both first-strike and regular combat damage.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
});
