import { defineCard } from "../define.js";

// EDHREC rank 3362.
// Makes a 1/1 green and white Elf Warrior → "Elf Warrior Token (Rhys the Redeemed)" (the
// existing "Elf Warrior Token" is green only).

const TOKEN_TEXT = "{2}{G/W}, {T}: Create a 1/1 green and white Elf Warrior creature token.";
const COPY_TEXT =
  "{4}{G/W}{G/W}, {T}: For each creature token you control, create a token that's a copy of that creature.";

export default defineCard({
  name: "Rhys the Redeemed",
  manaCost: "{G/W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 1,
  toughness: 1,
  text: `${TOKEN_TEXT}\n${COPY_TEXT}`,
  activated: [
    {
      cost: { mana: "{2}{G/W}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token (Rhys the Redeemed)", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
    {
      cost: { mana: "{4}{G/W}{G/W}", tap: true },
      targets: [],
      // Redoubled Stormsinger's `{ each }`: one copy of every matching
      // permanent as this resolves, a token stack once per token in it.
      effect: {
        kind: "create-token-copy",
        of: { each: { type: "creature", token: true, controlledBy: "you" } },
        count: 1,
        who: "you",
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
