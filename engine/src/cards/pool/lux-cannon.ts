import { defineCard } from "../define.js";

// EDHREC rank 4092.

export default defineCard({
  name: "Lux Cannon",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Put a charge counter on this artifact.\n{T}, Remove three charge counters from this artifact: Destroy target permanent.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: "{T}: Put a charge counter on this artifact.",
    },
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "charge", count: 3 } },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{T}, Remove three charge counters from this artifact: Destroy target permanent.",
    },
  ],
});
