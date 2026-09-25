import { defineCard } from "../define.js";

export default defineCard({
  name: "Reap the Seagraf",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{4}{U}" },
  text: "Create a 2/2 black Zombie creature token.\nFlashback {4}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Zombie Token", count: 1 },
});
