import { defineCard } from "../define.js";

export default defineCard({
  name: "Join the Dance",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  types: ["sorcery"],
  flashback: { cost: "{3}{G}{W}" },
  text: "Create two 1/1 white Human creature tokens.\nFlashback {3}{G}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Human Token", count: 2 },
});
