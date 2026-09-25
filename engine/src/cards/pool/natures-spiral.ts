import { defineCard } from "../define.js";

export default defineCard({
  name: "Nature's Spiral",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Return target permanent card from your graveyard to your hand.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
