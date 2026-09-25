import { defineCard } from "../define.js";

export default defineCard({
  name: "Aegis of the Heavens",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Target creature gets +1/+7 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 1, toughness: 7, duration: "end-of-turn" },
});
