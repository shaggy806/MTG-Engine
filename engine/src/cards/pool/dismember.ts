import { defineCard } from "../define.js";

export default defineCard({
  name: "Dismember",
  manaCost: "{1}{B/P}{B/P}",
  colors: ["B"],
  types: ["instant"],
  text: "({B/P} can be paid with either {B} or 2 life.)\nTarget creature gets -5/-5 until end of turn.",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -5, toughness: -5, duration: "end-of-turn" },
});
