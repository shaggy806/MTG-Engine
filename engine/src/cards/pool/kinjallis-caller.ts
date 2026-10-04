import { defineCard } from "../define.js";

// EDHREC rank 6361.
//
// Rulings:
//   [2017-09-29] To determine the total cost of a Dinosaur spell, start with the mana cost or
//     alternative cost you're paying, add any cost increases, then apply any cost reductions. The
//     mana value of the creature remains unchanged, no matter what the total cost to cast it was.
//   [2018-01-19] If an effect refers to a "[subtype] spell" or "[subtype] card," it refers only to
//     a spell or card that has that subtype. For example, March of the Drowned is a card that
//     benefits Pirates and features Pirates in its illustration, but it isn't a Pirate card.

const COST_TEXT = "Dinosaur spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Kinjalli's Caller",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 0,
  toughness: 3,
  text: COST_TEXT,
  static: [
    {
      // Otepec Huntmaster's shape.
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Dinosaur" }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
});
