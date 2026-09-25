import { defineCard } from "../define.js";

export default defineCard({
  name: "Morgue Theft",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{4}{B}" },
  text: "Return target creature card from your graveyard to your hand.\nFlashback {4}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
