import { defineCard } from "../define.js";

/** A modal double-faced card (sorcery // land) — its back face, Bala Ged
 * Sanctuary, is a land you play instead. */
export default defineCard({
  name: "Bala Ged Recovery",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Return target card from your graveyard to your hand.",
  targets: [{ kind: "card-in-graveyard", whose: "you" }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
  faces: ["Bala Ged Recovery", "Bala Ged Sanctuary"],
});
