import { defineCard } from "../define.js";

const MANA_TEXT = "Whenever you tap a nonland permanent for mana, add one mana of any type that permanent produced.";
const LOOK_TEXT =
  "{5}{G}{U}: Look at the top five cards of your library. You may put a non-Human creature card from among them " +
  "onto the battlefield. Put the rest on the bottom of your library in a random order.";

// #60 in top-commanders.txt.
//
// The first ability is a triggered mana ability (rule 605.1b): off the stack,
// at once, and the auto-payer counts it. The extra mana is Kinnan's, with
// none of the tapped permanent's restrictions or riders (the rulings); off a
// permanent that made more than one type (a Signet's {W}{U}) which type is
// the player's pick.
export default defineCard({
  name: "Kinnan, Bonder Prodigy",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 2,
  toughness: 2,
  text: `${MANA_TEXT}\n${LOOK_TEXT}`,
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { notTypes: ["land"] } },
      targets: [],
      effect: { kind: "add-mana", mana: "produced", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{G}{U}", tap: false },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 5,
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "bottom-random",
        filter: { type: "creature", notSubtypes: ["Human"] },
      },
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
});
