import { defineCard } from "../define.js";

export default defineCard({
  name: "Defy Gravity",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  flashback: { cost: "{U}" },
  text: "Target creature gains flying until end of turn.\nFlashback {U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
});
