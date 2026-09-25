import { defineCard } from "../define.js";

export default defineCard({
  name: "Shadowbeast Sighting",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  flashback: { cost: "{6}{G}" },
  text: "Create a 4/4 green Beast creature token.\nFlashback {6}{G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Beast Token", count: 1 },
});
