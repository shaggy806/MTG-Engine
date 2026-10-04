import { defineCard } from "../define.js";

// EDHREC rank 3169.

export default defineCard({
  name: "Songs of the Damned",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Add {B} for each creature card in your graveyard.",
  effect: { kind: "add-mana", mana: "B", amount: { countInGraveyard: { type: "creature", ownedBy: "you" } } },
});
