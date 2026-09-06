import { defineCard } from "../define.js";

export default defineCard({
  name: "Jump",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target creature gains flying until end of turn.",
  targets: ["creature"],
  effect: {
    kind: "grant-keyword",
    target: 0,
    keyword: "flying",
    duration: "end-of-turn",
  },
});
