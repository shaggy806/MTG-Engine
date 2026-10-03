import { defineCard } from "../define.js";

const TEXT =
  "Whenever Klauth attacks, add X mana in any combination of colors, where X is the total power of attacking creatures. " +
  "Spend this mana only to cast spells. Until end of turn, you don't lose this mana as steps and phases end.";

// Not a mana ability (the ruling): it uses the stack, and X — the attacking
// creatures' total power — is read as it resolves, so removing an attacker in
// response makes less. The split is the player's, asked as it resolves.
// "Until end of turn, you don't lose this mana" is `persists` (Savage
// Ventmaw's wording): kept through the turn's steps, emptied at cleanup.
export default defineCard({
  name: "Klauth, Unrivaled Ancient",
  manaCost: "{5}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"] },
        amount: { aggregate: "sum", of: "power", filter: { type: "creature", attacking: true } },
        spendOnly: { spell: {}, text: "Spend this mana only to cast spells." },
        persists: true,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
