import { defineCard } from "../define.js";

// EDHREC rank 3407.

const TEXT = "Whenever you draw your second card each turn, create a 1/1 white Human Soldier creature token.";

export default defineCard({
  name: "Prince Imrahil the Fair",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      // Alandra, Sky Dreamer's "second card each turn".
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
