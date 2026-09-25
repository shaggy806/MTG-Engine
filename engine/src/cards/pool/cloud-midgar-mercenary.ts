import { defineCard } from "../define.js";

// #329 in top-commanders.txt.
const ENTER_TEXT =
  "When Cloud enters, search your library for an Equipment card, reveal it, put it into your hand, then shuffle.";
const DOUBLE_TEXT =
  "As long as Cloud is equipped, if a triggered ability of Cloud or an Equipment attached to it " +
  "triggers, that ability triggers an additional time.";

export default defineCard({
  name: "Cloud, Midgar Mercenary",
  manaCost: "{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Mercenary"],
  power: 2,
  toughness: 1,
  text: `${ENTER_TEXT}\n${DOUBLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Equipment" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "source", filter: { equipped: true } },
      doubleTriggersOf: { selfAndEquipment: true },
      text: DOUBLE_TEXT,
    },
  ],
});
