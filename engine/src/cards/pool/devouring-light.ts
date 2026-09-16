import { defineCard } from "../define.js";

export default defineCard({
  name: "Devouring Light",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Convoke\nExile target attacking or blocking creature.",
  convoke: true,
  targets: ["attacking-or-blocking-creature"],
  effect: { kind: "exile", target: 0 },
});
