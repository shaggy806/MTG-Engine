import { CHOSEN_CREATURE_TYPE } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 2716.
//
// Rulings:
//   [2025-11-17] Tapping an untapped creature that's attacking or blocking to convoke a spell
//     won't cause that creature to stop attacking or blocking.
//   [2025-11-17] You choose the creature type as Harmonized Crescendo resolves. Once Harmonized
//     Crescendo starts to resolve, players can't respond to the choice or take any actions until
//     Harmonized Crescendo finishes resolving.
//
// Distant Melody's effect, with convoke.
export default defineCard({
  name: "Harmonized Crescendo",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nChoose a creature type. Draw a card for each permanent you control of that type.",
  convoke: true,
  effect: {
    kind: "choose-creature-type",
    then: {
      kind: "draw",
      // "Each **permanent**", not creature.
      amount: { countOf: { controlledBy: "you", subtype: CHOSEN_CREATURE_TYPE } },
    },
  },
});
