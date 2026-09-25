import { defineCard } from "../define.js";

export default defineCard({
  name: "Show of Valor",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Target creature gets +2/+4 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 2, toughness: 4, duration: "end-of-turn" },
});
