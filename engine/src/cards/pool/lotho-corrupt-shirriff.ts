import { defineCard } from "../define.js";

// "A player casts their second spell each turn" is the caster's own count
// (Kraum's shape, for any player), so spells cast before Lotho arrived count
// — the 2023-06-16 ruling. `otherOnly` is rule 113.6: Lotho cast as someone's
// second spell is on the stack, where its ability doesn't function, but the
// cast spell joins the trigger scan with its own abilities.
const TEXT =
  "Whenever a player casts their second spell each turn, you lose 1 life and create a Treasure " +
  "token.";

export default defineCard({
  name: "Lotho, Corrupt Shirriff",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Rogue"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", otherOnly: true, nthEachTurn: 2 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1 },
          { kind: "create-token", token: "Treasure Token", count: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
