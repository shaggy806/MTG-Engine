import { defineCard } from "../define.js";

// - The reduction is generic only ({1} off a creature spell of the chosen
//   type that its controller casts), and nothing before a type is chosen.
// - The upkeep look puts the card into the hand only if it's a creature card
//   of the chosen type, revealed as it's taken; otherwise — or if its
//   controller declines — it stays on top unrevealed (the rulings). With no
//   type chosen nothing ever qualifies, though the look still happens.
const CHOOSE_TEXT = "As this artifact enters, choose a creature type.";
const COST_TEXT = "Creature spells you cast of the chosen type cost {1} less to cast.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, look at the top card of your library. If it's a creature " +
  "card of the chosen type, you may reveal it and put it into your hand.";

export default defineCard({
  name: "Herald's Horn",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${CHOOSE_TEXT}\n${COST_TEXT}\n${UPKEEP_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature" },
        caster: "you",
        reduceGeneric: 1,
        matchesChosenCreatureType: true,
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { type: "creature", ofChosenType: true },
        destination: "hand",
        leftover: "stay",
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
