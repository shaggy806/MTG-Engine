import { defineCard } from "../define.js";

// EDHREC rank 5600.

export default defineCard({
  name: "Shard of the Nightbringer",
  manaCost: "{5}{B}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["C'tan"],
  power: 8,
  toughness: 8,
  keywords: ["flying"],
  text: "Flying\nDrain Life — When this creature enters, if you cast it, target opponent loses half their life, rounded up. You gain life equal to the life lost this way.",
  triggered: [
    {
      // "If you cast it" is read off how it entered (Rocco, Cabaretti
      // Caterer). The half is of the target's life as it resolves (Peer into
      // the Abyss), and the gain is the life actually lost (Gray Merchant).
      trigger: { on: "enters-battlefield", who: "self", filter: { cast: true, castBy: "you" } },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", target: 0, amount: { half: { lifeTotal: "each" }, round: "up" } },
          { kind: "gain-life", amount: { lifeLostThisWay: true } },
        ],
      },
      resolve: null,
      text: "Drain Life — When this creature enters, if you cast it, target opponent loses half their life, rounded up. You gain life equal to the life lost this way.",
    },
  ],
});
