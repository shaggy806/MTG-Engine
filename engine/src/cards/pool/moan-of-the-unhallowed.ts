import { defineCard } from "../define.js";

export default defineCard({
  name: "Moan of the Unhallowed",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{5}{B}{B}" },
  text: "Create two 2/2 black Zombie creature tokens.\nFlashback {5}{B}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Zombie Token", count: 2 },
});
