import { defineCard } from "../define.js";

export default defineCard({
  name: "Razaketh, the Foulblooded",
  manaCost: "{5}{B}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 8,
  toughness: 8,
  keywords: ["flying", "trample"],
  text: "Flying, trample\nPay 2 life, Sacrifice another creature: Search your library for a card, put that card into your hand, then shuffle.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 2, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "search-library", filter: {}, destination: "hand", min: 0, max: 1 },
      resolve: null,
      text: "Pay 2 life, Sacrifice another creature: Search your library for a card, put that card into your hand, then shuffle.",
      otherOnly: true,
    },
  ],
});
