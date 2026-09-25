import { defineCard } from "../define.js";

export default defineCard({
  name: "Sage's Knowledge",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return target sorcery card from your graveyard to your hand.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "sorcery" } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
