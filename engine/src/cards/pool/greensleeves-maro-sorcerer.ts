import { defineCard } from "../define.js";

// EDHREC rank 2769.
//
// Rulings:
//   [2022-09-09] The ability that defines Greensleeves, Maro-Sorcerer's power and toughness works
//     in all zones, not just on the battlefield.
//   [2024-11-08] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//
// "From planeswalkers and from Wizards" is two protections: a card type and a
// subtype filter, ORed (rule 702.16).

const PROTECTION_TEXT = "Protection from planeswalkers and from Wizards";
const PT_TEXT = "Greensleeves's power and toughness are each equal to the number of lands you control.";
const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, create a 3/3 green Badger creature token.";

export default defineCard({
  name: "Greensleeves, Maro-Sorcerer",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Sorcerer"],
  power: 0,
  toughness: 0,
  text: `${PROTECTION_TEXT}\n${PT_TEXT}\n${LANDFALL_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      protection: { types: ["planeswalker"], filter: { subtype: "Wizard" } },
      text: PROTECTION_TEXT,
    },
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: { countOf: { type: "land", controlledBy: "you" } }, plusPower: 0, plusToughness: 0 },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Badger Token", count: 1 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
