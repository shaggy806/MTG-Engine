import { defineCard } from "../define.js";

export default defineCard({
  name: "Crimson Caravaneer",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 1,
  toughness: 2,
  keywords: ["double-strike", "trample"],
  text: "Double strike, trample\nWhenever this creature deals combat damage to a player, create a Junk token. (It's an artifact with \"{T}, Sacrifice this token: Exile the top card of your library. You may play that card this turn. Activate only as a sorcery.\")",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Junk Token", count: 1 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, create a Junk token.",
    },
  ],
});
