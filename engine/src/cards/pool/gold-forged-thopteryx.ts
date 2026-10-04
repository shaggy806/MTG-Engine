import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 2611.
//
// Rulings:
//   [2023-05-12] Once a ward ability has triggered, causing that legendary permanent to lose ward
//     by removing Gold-Forged Thopteryx won't affect that ability. The appropriate player will
//     still have to pay {2} or see their spell or ability countered.

const WARD_TEXT =
  "Each legendary permanent you control has ward {2}. (Whenever it becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)";

export default defineCard({
  name: "Gold-Forged Thopteryx",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["artifact", "creature"],
  subtypes: ["Dinosaur", "Thopter"],
  power: 1,
  toughness: 3,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${WARD_TEXT}`,
  static: [
    {
      // A granted ward is a real triggered ability: once it has triggered,
      // losing the grant doesn't stop it (the ruling).
      affects: { scope: "filter", filter: { supertype: "legendary", controlledBy: "you" } },
      grantsTriggered: [ward({ mana: "{2}" })],
      text: "Each legendary permanent you control has ward {2}.",
    },
  ],
});
