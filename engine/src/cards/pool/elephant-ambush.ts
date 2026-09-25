import { defineCard } from "../define.js";

export default defineCard({
  name: "Elephant Ambush",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["instant"],
  flashback: { cost: "{6}{G}{G}" },
  text: "Create a 3/3 green Elephant creature token.\nFlashback {6}{G}{G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Elephant Token", count: 1 },
});
