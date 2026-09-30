import { defineCard } from "../define.js";

// Snapcaster Mage's grant, as a spell.
export default defineCard({
  name: "Flashback",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Target instant or sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost. (You may cast that card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["instant-or-sorcery-in-your-graveyard"],
  effect: { kind: "grant-flashback", target: 0 },
});
