import { defineCard } from "../define.js";

export default defineCard({
  name: "Lingering Souls",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  flashback: { cost: "{1}{B}" },
  text: "Create two 1/1 white Spirit creature tokens with flying.\nFlashback {1}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Spirit Token", count: 2 },
});
