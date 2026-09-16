import { defineCard } from "../define.js";

export default defineCard({
  name: "Dream Pillager",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever this creature deals combat damage to a player, exile that many cards from the top of your library. Until end of turn, you may cast spells from among those exiled cards.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        // "That many" — the damage just dealt.
        amount: { triggerValue: true },
        duration: "end-of-turn",
        // "cast spells from among" — no lands.
        castOnly: true,
      },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, exile that many cards from the top of your library. Until end of turn, you may cast spells from among those exiled cards.",
    },
  ],
});
