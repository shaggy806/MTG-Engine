import { defineCard } from "../define.js";

export default defineCard({
  name: "Unnatural Speed",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Arcane"],
  text: "Target creature gains haste until end of turn.",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
});
