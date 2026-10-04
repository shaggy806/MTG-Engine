import { defineCard } from "../define.js";

// EDHREC rank 3543.

export default defineCard({
  name: "Auroral Procession",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["instant"],
  text: "Return target card from your graveyard to your hand.",
  targets: [{ kind: "card-in-graveyard", whose: "you" }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
