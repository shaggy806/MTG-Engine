import { defineCard } from "../define.js";

export default defineCard({
  name: "Howling Fury",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target creature gets +4/+0 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 4, toughness: 0, duration: "end-of-turn" },
});
