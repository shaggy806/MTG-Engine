import { defineCard } from "../define.js";

export default defineCard({
  name: "Beast Attack",
  manaCost: "{2}{G}{G}{G}",
  colors: ["G"],
  types: ["instant"],
  flashback: { cost: "{2}{G}{G}{G}" },
  text: "Create a 4/4 green Beast creature token.\nFlashback {2}{G}{G}{G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Beast Token", count: 1 },
});
