import { defineCard } from "../define.js";

/** Junk — Dogmeat, Ever Loyal's artifact token (PIP). */
export default defineCard({
  name: "Junk Token",
  art: "https://scryfall.com/card/tpip/15/junk",
  types: ["artifact"],
  subtypes: ["Junk"],
  text:
    "{T}, Sacrifice this artifact: Exile the top card of your library. You may play that card " +
    "this turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text:
        "{T}, Sacrifice this artifact: Exile the top card of your library. You may play that card " +
        "this turn. Activate only as a sorcery.",
    },
  ],
});
