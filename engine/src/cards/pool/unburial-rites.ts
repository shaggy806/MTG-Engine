import { defineCard } from "../define.js";

export default defineCard({
  name: "Unburial Rites",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{3}{W}" },
  text: "Return target creature card from your graveyard to the battlefield.\nFlashback {3}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
