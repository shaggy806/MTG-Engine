import { defineCard } from "../define.js";

export default defineCard({
  name: "Keen Buccaneer",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Octopus", "Pirate"],
  power: 2,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nExhaust — {1}{U}: Draw a card, then discard a card. Put a +1/+1 counter on this creature. (Activate each exhaust ability only once.)",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "sequence",
            effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
          },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: "Exhaust — {1}{U}: Draw a card, then discard a card. Put a +1/+1 counter on this creature.",
      exhaust: true,
    },
  ],
});
