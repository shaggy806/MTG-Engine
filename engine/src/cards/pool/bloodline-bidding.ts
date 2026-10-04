import { CHOSEN_CREATURE_TYPE } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 2552.
//
// Rulings:
//   [2025-11-17] You choose the creature type as Bloodline Bidding resolves. Once Bloodline
//     Bidding starts to resolve, players can't respond to the choice or take any actions until
//     Bloodline Bidding finishes resolving.
//
// Distant Melody's choose-then shape; the return is Splendid Reclamation's mass
// `return-from-graveyard` (one event — every returned card sees the others enter).

export default defineCard({
  name: "Bloodline Bidding",
  manaCost: "{6}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  convoke: true,
  text: "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nChoose a creature type. Return all creature cards of the chosen type from your graveyard to the battlefield.",
  effect: {
    kind: "choose-creature-type",
    then: {
      kind: "return-from-graveyard",
      filter: { type: "creature", subtype: CHOSEN_CREATURE_TYPE },
      destination: "battlefield",
      count: "all",
    },
  },
});
