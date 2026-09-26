import { defineCard } from "../define.js";

// #80 in top-commanders.txt.
//
// "That many" is how many Birds attacked. The card for the hand is chosen
// first and moves first; then any number of the land cards left go onto the
// battlefield tapped, in the same move as the rest going to the graveyard.
const ATTACK_TEXT =
  "Whenever one or more Birds you control attack, look at that many cards from the top of your library. You may " +
  "put one of them into your hand. Then put any number of land cards from among them onto the battlefield tapped " +
  "and the rest into your graveyard.";
const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, Choco gets +1/+0 until end of turn.";

export default defineCard({
  name: "Choco, Seeker of Paradise",
  manaCost: "{1}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 3,
  toughness: 5,
  text: `${ATTACK_TEXT}\n${LANDFALL_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks-batch", who: "you-control", filter: { subtype: "Bird" } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: { triggerValue: true },
        min: 0,
        max: 1,
        destination: "hand",
        leftover: "graveyard",
        secondPick: {
          filter: { type: "land" },
          min: 0,
          max: { triggerValue: true },
          destination: "battlefield",
          enterTapped: true,
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
