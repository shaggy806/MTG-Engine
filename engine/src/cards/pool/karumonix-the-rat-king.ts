import { defineCard } from "../define.js";

// #432 in top-commanders.txt.
const ENTERS_TEXT =
  "When Karumonix enters, look at the top five cards of your library. You may reveal any number of Rat cards " +
  "from among them and put the revealed cards into your hand. Put the rest on the bottom of your library in a " +
  "random order.";

export default defineCard({
  name: "Karumonix, the Rat King",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Rat"],
  power: 3,
  toughness: 3,
  toxic: 1,
  text:
    "Toxic 1 (Players dealt combat damage by this creature also get a poison counter.)\n" +
    `Other Rats you control have toxic 1.\n${ENTERS_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Rat" },
      grantToxic: 1,
      text: "Other Rats you control have toxic 1.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 5,
        reveal: "chosen",
        min: 0,
        max: 5,
        filter: { subtype: "Rat" },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
