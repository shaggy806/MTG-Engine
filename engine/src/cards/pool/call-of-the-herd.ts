import { defineCard } from "../define.js";

export default defineCard({
  name: "Call of the Herd",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  flashback: { cost: "{3}{G}" },
  text: "Create a 3/3 green Elephant creature token.\nFlashback {3}{G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Elephant Token", count: 1 },
});
