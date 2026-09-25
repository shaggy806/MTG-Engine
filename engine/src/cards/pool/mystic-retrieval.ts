import { defineCard } from "../define.js";

export default defineCard({
  name: "Mystic Retrieval",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  flashback: { cost: "{2}{R}" },
  text: "Return target instant or sorcery card from your graveyard to your hand.\nFlashback {2}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
