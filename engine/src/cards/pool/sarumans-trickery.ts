import { defineCard } from "../define.js";

// EDHREC rank 4756.
// Absorb's counter-then-rider shape, with Orcish Bowmasters' amass.

export default defineCard({
  name: "Saruman's Trickery",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell.\nAmass Orcs 1. (Put a +1/+1 counter on an Army you control. It's also an Orc. If you don't control an Army, create a 0/0 black Orc Army creature token first.)",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "amass", amount: 1, creatureType: "Orc" },
    ],
  },
});
