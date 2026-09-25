import { defineCard } from "../define.js";

export default defineCard({
  name: "Shriek of Dread",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gains fear until end of turn. (It can't be blocked except by artifact creatures and/or black creatures.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "fear", duration: "end-of-turn" },
});
