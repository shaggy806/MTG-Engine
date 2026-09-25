import { defineCard } from "../define.js";

export default defineCard({
  name: "Chatter of the Squirrel",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  flashback: { cost: "{1}{G}" },
  text: "Create a 1/1 green Squirrel creature token.\nFlashback {1}{G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Squirrel Token", count: 1 },
});
