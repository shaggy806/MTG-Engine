import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 3243.
//
// Rulings:
//   [2025-11-17] You don't have to reveal the card you look at with Gathering Stone's third ability
//     even if it's a card of the chosen type. If you choose not to reveal it this way, you can
//     still put it into your graveyard.
//   [2025-11-17] Gathering Stone's second ability applies only to generic mana in the total cost of
//     spells you cast of the chosen type.
//
// "Spells of the chosen type" is any spell with that creature type (a Kindred
// card, a changeling), not only creature spells — so `applies` is empty and
// the chosen type is the whole filter. The look is Herald's Horn's, any card
// of the chosen type; the card not taken may then go to the graveyard
// (`secondPick`, asked only of what the first pick left), or stay on top.
const CHOOSE_TEXT = "As this artifact enters, choose a creature type.";
const COST_TEXT = "Spells you cast of the chosen type cost {1} less to cast.";
const LOOK_TEXT =
  "When this artifact enters and at the beginning of your upkeep, look at the top card of your library. " +
  "If it's a card of the chosen type, you may reveal it and put it into your hand. If you don't put the card " +
  "into your hand, you may put it into your graveyard.";

const look: EffectSpec = {
  kind: "look-and-choose",
  zone: "library",
  count: 1,
  reveal: "chosen",
  min: 0,
  max: 1,
  filter: { ofChosenType: true },
  destination: "hand",
  secondPick: { min: 0, max: 1, destination: "graveyard" },
  leftover: "stay",
};

export default defineCard({
  name: "Gathering Stone",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: `${CHOOSE_TEXT}\n${COST_TEXT}\n${LOOK_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: {},
        caster: "you",
        reduceGeneric: 1,
        matchesChosenCreatureType: true,
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: look,
      resolve: null,
      text: LOOK_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: look,
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
});
