import { defineCard } from "../define.js";

// EDHREC rank 3470.
//
// Rulings:
//   [2020-04-17] If Species Specialist happens to have the chosen creature type, its ability
//     triggers when it dies.
//   [2020-04-17] If a creature of the chosen type dies at the same time as Species Specialist, its
//     ability triggers for that creature.
//   [2020-04-17] You must choose an existing creature type, such as Human or Warrior. Card types
//     such as artifact and supertypes such as legendary can't be chosen.
//
// `ofChosenType` reads a departed Specialist's choice off its last-known
// information (rule 608.2h), so a creature dying beside it still counts.

const TEXT = "Whenever a creature of the chosen type dies, you may draw a card.";

export default defineCard({
  name: "Species Specialist",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  text: `As this creature enters, choose a creature type.\n${TEXT}`,
  chooseCreatureTypeOnEnter: true,
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", ofChosenType: true } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
