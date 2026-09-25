import { defineCard } from "../define.js";

export default defineCard({
  name: "Might of Oaks",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gets +7/+7 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 7, toughness: 7, duration: "end-of-turn" },
});
