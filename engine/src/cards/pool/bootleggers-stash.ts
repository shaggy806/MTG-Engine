import { defineCard } from "../define.js";

const GRANTED_TEXT = "{T}: Create a Treasure token.";
const TEXT = `Lands you control have "${GRANTED_TEXT}"`;

// Not a mana ability: it makes a token, not mana, so it uses the stack.
export default defineCard({
  name: "Bootleggers' Stash",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["artifact"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "land", controlledBy: "you" } },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: { kind: "create-token", token: "Treasure Token", count: 1 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
