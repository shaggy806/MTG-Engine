import { defineCard } from "../define.js";

// EDHREC rank 3399.

const GRANT_TEXT = 'Enchanted land has "{T}: Create a 1/1 green Squirrel creature token."';

export default defineCard({
  name: "Squirrel Nest",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant land\n${GRANT_TEXT}`,
  targets: ["land"],
  static: [
    {
      // Presence of Gond's grant, on Abundant Growth's enchant-land shape.
      affects: { scope: "attached" },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: { kind: "create-token", token: "Squirrel Token", count: 1 },
          resolve: null,
          text: "{T}: Create a 1/1 green Squirrel creature token.",
        },
      ],
      text: GRANT_TEXT,
    },
  ],
});
