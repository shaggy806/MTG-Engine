import { defineCard } from "../define.js";

// #464 in top-commanders.txt. Transforms into Aang, Destined Savior.
//
// The delayed transform does nothing if Aang has transformed since it was
// set up (rule 701.28f), so two creatures leaving don't flip him back.
const ENTER_TEXT =
  "When Aang enters, look at the top five cards of your library. You may put a creature card with mana " +
  "value 4 or less from among them onto the battlefield. Put the rest on the bottom of your library in " +
  "a random order.";
const LEAVE_TEXT =
  "When another creature you control leaves the battlefield, transform Aang at the beginning of the next upkeep.";

export default defineCard({
  name: "Aang, at the Crossroads",
  manaCost: "{2}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Avatar", "Ally"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${LEAVE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 5,
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "bottom-random",
        filter: { type: "creature", manaValue: { op: "lte", n: 4 } },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-upkeep",
        effect: { kind: "transform", target: "source" },
        text: "Transform Aang.",
      },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
  faces: ["Aang, at the Crossroads", "Aang, Destined Savior"],
  transform: true,
});
