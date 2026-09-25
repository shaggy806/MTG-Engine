import { defineCard } from "../define.js";

export default defineCard({
  name: "Ritual of Restoration",
  manaCost: "{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return target artifact card from your graveyard to your hand.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
