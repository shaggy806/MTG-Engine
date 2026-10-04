import { defineCard } from "../define.js";

// EDHREC rank 6191.
// Makes Rat → "Rat Token" (1/1 black Rat, no abilities).

const TEXT = "Create a tapped 1/1 black Rat creature token for each creature card in your graveyard.";

export default defineCard({
  name: "Revenge of the Rats",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{2}{B}{B}" },
  text: `${TEXT}\nFlashback {2}{B}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)`,
  // Counted as it resolves; this card is on the stack then, so it never
  // counts itself. Cards only — tokens never count.
  effect: {
    kind: "create-token",
    token: "Rat Token",
    count: { countInGraveyard: { type: "creature", ownedBy: "you" } },
    tapped: true,
  },
});
