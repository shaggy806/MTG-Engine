import { defineCard } from "../define.js";

// Only the cards in your graveyard as it resolves gain flashback, and a card
// with no mana cost gains none (the rulings). A card that has a flashback of
// its own may be cast with either (Game.flashbacksOf).
export default defineCard({
  name: "Past in Flames",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Each instant and sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost.\n" +
    "Flashback {4}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "grant-flashback-all", filter: { typesAnyOf: ["instant", "sorcery"] } },
  flashback: { cost: "{4}{R}" },
});
