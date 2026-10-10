import { defineCard } from "../define.js";

// EDHREC rank 3569. A results table (rule 706.3a).
const TEXT =
  "Whenever this creature attacks, roll a d20.\n1—9 | Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\n10—19 | Create two Treasure tokens.\n20 | Create three Treasure tokens.";

export default defineCard({
  name: "Hoarding Ogre",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "roll-dice",
        sides: 20,
        table: [
          { min: 1, max: 9, effect: { kind: "create-token", token: "Treasure Token", count: 1 } },
          { min: 10, max: 19, effect: { kind: "create-token", token: "Treasure Token", count: 2 } },
          { min: 20, effect: { kind: "create-token", token: "Treasure Token", count: 3 } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
