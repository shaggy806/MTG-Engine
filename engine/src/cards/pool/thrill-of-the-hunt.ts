import { defineCard } from "../define.js";

export default defineCard({
  name: "Thrill of the Hunt",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  flashback: { cost: "{W}" },
  text: "Target creature gets +1/+2 until end of turn.\nFlashback {W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 1, toughness: 2, duration: "end-of-turn" },
});
