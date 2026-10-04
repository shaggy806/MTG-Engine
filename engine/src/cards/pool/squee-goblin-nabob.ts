import { defineCard } from "../define.js";

// EDHREC rank 3913.
//
// Rulings:
//   [2018-12-07] If Squee isn't in your graveyard as your upkeep begins, its ability won't
//     trigger. You can't take any actions during your turn before your upkeep begins.

const TEXT = "At the beginning of your upkeep, you may return this card from your graveyard to your hand.";

export default defineCard({
  name: "Squee, Goblin Nabob",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      // Works only from the graveyard (rule 113.6k); "source" is the card only
      // while it's still that object there (rule 400.7).
      fromGraveyard: true,
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Return Squee, Goblin Nabob from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
