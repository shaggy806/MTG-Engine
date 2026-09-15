import { defineCard } from "../define.js";

// Real text targets a card in a graveyard, and there is no `TargetSpec` for
// that (AUTHORING §15) — so the card is chosen as Regrowth resolves, from the
// same public zone, rather than as it is cast. See `eternal-witness.ts`.
export default defineCard({
  name: "Regrowth",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Return target card from your graveyard to your hand.",
  effect: {
    kind: "look-and-choose",
    zone: "graveyard",
    min: 1,
    max: 1,
    destination: "hand",
    leftover: "stay",
  },
});
