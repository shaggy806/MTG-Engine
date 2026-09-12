import { defineCard } from "../define.js";

// needed-cards P14. New: CardDefinition.chooseCreatureTypeOnEnter (a
// `choose-creature-type` AwaitingDecision, mirroring Clone's choose-copy) +
// StaticAbility.costModification.matchesChosenCreatureType.
export default defineCard({
  name: "Urza's Incubator",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text:
    "As Urza's Incubator enters, choose a creature type.\n" +
    "Creature spells of the chosen type cost {2} less to cast.",
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", controlledBy: "you" },
        reduceGeneric: 2,
        matchesChosenCreatureType: true,
      },
      text: "Creature spells of the chosen type cost {2} less to cast.",
    },
  ],
});
