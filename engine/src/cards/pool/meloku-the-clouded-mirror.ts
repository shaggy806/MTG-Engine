import { defineCard } from "../define.js";

// EDHREC rank 5876.

const TOKEN_TEXT =
  "{1}, Return a land you control to its owner's hand: Create a 1/1 blue Illusion creature token with flying.";

export default defineCard({
  name: "Meloku the Clouded Mirror",
  manaCost: "{4}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Moonfolk", "Wizard"],
  power: 2,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TOKEN_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: false, returnToHand: { count: 1, filter: { type: "land" } } },
      targets: [],
      effect: { kind: "create-token", token: "Illusion Token (Flying)", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
