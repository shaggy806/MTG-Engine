import { defineCard } from "../define.js";

// EDHREC rank 4070.
// Makes Elemental → use "5/3 Green Elemental Token".
//
// Rulings:
//   [2022-10-14] Titania, Nature's Force doesn't change the times when you can play those Forests.
//     You can still play only one land per turn, and only during your main phase when you have
//     priority and the stack is empty.

export default defineCard({
  name: "Titania, Nature's Force",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 6,
  toughness: 6,
  text: "You may play Forests from your graveyard.\nWhenever a Forest you control enters, create a 5/3 green Elemental creature token.\nWhenever an Elemental you control dies, you may mill three cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Forest" } },
      targets: [],
      effect: { kind: "create-token", token: "5/3 Green Elemental Token", count: 1 },
      resolve: null,
      text: "Whenever a Forest you control enters, create a 5/3 green Elemental creature token.",
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Elemental" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Mill three cards?",
        effect: { kind: "mill", target: "you", amount: 3 },
      },
      resolve: null,
      text: "Whenever an Elemental you control dies, you may mill three cards.",
    },
  ],
  static: [
    {
      // Ramunap Excavator's permission, narrowed to Forests.
      affects: { scope: "self" },
      playFromGraveyard: { type: "land", subtype: "Forest" },
      text: "You may play Forests from your graveyard.",
    },
  ],
});
