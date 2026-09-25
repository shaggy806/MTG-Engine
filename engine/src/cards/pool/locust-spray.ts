import { defineCard } from "../define.js";

export default defineCard({
  name: "Locust Spray",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  cycling: { cost: "{B}" },
  text: "Target creature gets -1/-1 until end of turn.\nCycling {B} ({B}, Discard this card: Draw a card.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
});
