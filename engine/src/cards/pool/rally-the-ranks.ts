import { defineCard } from "../define.js";

// EDHREC rank 4663.
//
// Rulings:
//   [2021-02-05] You must choose an existing creature type, such as Hippo or Hellion. You can’t
//     choose card types (e.g., artifact) or supertypes (e.g., snow).
//   [2021-02-05] Because damage remains marked on creatures until the damage is removed as the
//     turn ends, nonlethal damage dealt to creatures you control may become lethal if Rally the
//     Ranks leaves the battlefield that turn.
//
// Icon of Ancestry's anthem shape.

const CHOOSE_TEXT = "As this enchantment enters, choose a creature type.";
const PUMP_TEXT = "Creatures you control of the chosen type get +1/+1.";

export default defineCard({
  name: "Rally the Ranks",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${CHOOSE_TEXT}\n${PUMP_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", ofChosenType: true } },
      grantPt: [1, 1],
      text: PUMP_TEXT,
    },
  ],
});
