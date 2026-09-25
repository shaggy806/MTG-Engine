import { defineCard } from "../define.js";

export default defineCard({
  name: "Utter End",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Exile target nonland permanent.",
  targets: ["nonland-permanent"],
  effect: { kind: "exile", target: 0 },
});
