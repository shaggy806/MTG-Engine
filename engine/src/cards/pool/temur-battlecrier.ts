import { defineCard } from "../define.js";

// needed-cards P16. New: costModification.reduceGeneric may be a live count
// instead of a fixed number. "During your turn" was already expressible
// (StaticCondition "your-turn"). Caught along the way: costModificationFor
// evaluated `controlledBy: "you"` from the *casting player's* perspective,
// which is always trivially true (a spell is always controlled by whoever
// casts it) — so an opponent's Foundry Inspector/Dragonspeaker Shaman/Urza's
// Incubator could incorrectly discount your spells too. Fixed to evaluate
// from the static's own controller's perspective, which is what every
// existing costModification card actually means.
export default defineCard({
  name: "Temur Battlecrier",
  manaCost: "{G}{U}{R}",
  colors: ["G", "U", "R"],
  types: ["creature"],
  subtypes: ["Orc", "Ranger"],
  power: 4,
  toughness: 3,
  text: "During your turn, spells you cast cost {1} less to cast for each creature you control with power 4 or greater.",
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      costModification: {
        applies: { controlledBy: "you" },
        reduceGeneric: {
          countOf: { type: "creature", power: { op: "gte", n: 4 }, controlledBy: "you" },
        },
      },
      text: "During your turn, spells you cast cost {1} less to cast for each creature you control with power 4 or greater.",
    },
  ],
});
