import { defineCard } from "../define.js";

// #125 in top-commanders.txt.
//
// - Changeling (rule 702.73a) makes Morophon every creature type in every
//   zone — `subtypes.ts`: a Goblin to a Goblin lord, both a Dog and a Cat
//   spell to Rin and Seri, and, as a commander, one that shares a creature
//   type with every creature spell that has one (Path of Ancestry).
// - "As Morophon enters, choose a creature type" is asked before it arrives
//   (rule 614.12), from the whole catalogue: only an existing creature type
//   may be chosen (the third ruling).
// - The reduction is any spell of the chosen type its controller casts, from
//   any zone — a changeling spell is of every type. It takes up to one pip of
//   each colour, or a hybrid pip of that colour when there's no plain one
//   (the first two rulings: {2}{W/U}{W/U} costs {2}, {4}{R}{W}{W} costs
//   {4}{W}), and never touches the generic part. It applies to the total
//   cost, so a kicker's or an alternative cost's coloured pips come off too
//   (the fourth ruling). It isn't Morophon's own discount: the static works
//   only from the battlefield.
// - The anthem is "other" creatures, read live, so it ends the moment
//   Morophon leaves (the last ruling's damage stays marked).
// - A Morophon that enters with nothing chosen reduces nothing and pumps
//   nothing. The engine doesn't yet ask a *token copy* for its "as this
//   enters" choice (AUTHORING §15), so a token copy of Morophon is one — as
//   a copy of Urza's Incubator or Cavern of Souls already is.
const CHANGELING_TEXT = "Changeling (This card is every creature type.)";
const CHOOSE_TEXT = "As Morophon enters, choose a creature type.";
const COST_TEXT =
  "Spells of the chosen type you cast cost {W}{U}{B}{R}{G} less to cast. This effect reduces " +
  "only the amount of colored mana you pay.";
const ANTHEM_TEXT = "Other creatures you control of the chosen type get +1/+1.";

export default defineCard({
  name: "Morophon, the Boundless",
  manaCost: "{7}",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 6,
  toughness: 6,
  keywords: ["changeling"],
  text: `${CHANGELING_TEXT}\n${CHOOSE_TEXT}\n${COST_TEXT}\n${ANTHEM_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: {},
        matchesChosenCreatureType: true,
        caster: "you",
        reduceColored: "{W}{U}{B}{R}{G}",
        coloredOnly: true,
      },
      text: COST_TEXT,
    },
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", ofChosenType: true },
        excludeSelf: true,
      },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
});
