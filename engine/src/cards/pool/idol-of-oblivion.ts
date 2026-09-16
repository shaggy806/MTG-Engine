import { defineCard } from "../define.js";

export default defineCard({
  name: "Idol of Oblivion",
  manaCost: "{2}",
  types: ["artifact"],
  text:
    "{T}: Draw a card. Activate only if you created a token this turn.\n" +
    "{8}, {T}, Sacrifice Idol of Oblivion: Create a 10/10 colorless Eldrazi " +
    "creature token.",
  activated: [
    {
      cost: { mana: null, tap: true },
      condition: { kind: "created-token-this-turn" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}: Draw a card. Activate only if you created a token this turn.",
    },
    {
      cost: { mana: "{8}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Token", count: 1 },
      resolve: null,
      text:
        "{8}, {T}, Sacrifice Idol of Oblivion: Create a 10/10 colorless Eldrazi " +
        "creature token.",
    },
  ],
});
