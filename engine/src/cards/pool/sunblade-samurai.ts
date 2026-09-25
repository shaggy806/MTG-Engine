import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunblade Samurai",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Human", "Samurai"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nChannel — {2}, Discard this card: Search your library for a basic Plains card, reveal it, put it into your hand, then shuffle. You gain 2 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "search-library",
            filter: { supertype: "basic", subtype: "Plains" },
            destination: "hand",
            min: 0,
            max: 1,
            reveal: true,
          },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: "Channel — {2}, Discard this card: Search your library for a basic Plains card, reveal it, put it into your hand, then shuffle. You gain 2 life.",
      zone: "hand",
    },
  ],
});
