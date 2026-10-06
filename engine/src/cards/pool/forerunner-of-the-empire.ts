import { defineCard } from "../define.js";

// EDHREC rank 6482.
//
// The tutor is Elvish Harbinger's; the damage is every creature, this one
// and the Dinosaur included, dealt by this creature (as it last existed, if
// it has left).
const ENTER_TEXT =
  "When this creature enters, you may search your library for a Dinosaur card, reveal it, then shuffle and put that card on top.";
const DINO_TEXT = "Whenever a Dinosaur you control enters, you may have this creature deal 1 damage to each creature.";

export default defineCard({
  name: "Forerunner of the Empire",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 3,
  text: `${ENTER_TEXT}\n${DINO_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a Dinosaur card?",
        effect: {
          kind: "search-library",
          filter: { subtype: "Dinosaur" },
          destination: "library-top",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Dinosaur" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Deal 1 damage to each creature?",
        effect: { kind: "damage-all", filter: { type: "creature" }, amount: 1 },
      },
      resolve: null,
      text: DINO_TEXT,
    },
  ],
});
