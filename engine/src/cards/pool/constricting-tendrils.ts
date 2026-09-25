import { defineCard } from "../define.js";

export default defineCard({
  name: "Constricting Tendrils",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Target creature gets -3/-0 until end of turn.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -3, toughness: 0, duration: "end-of-turn" },
});
