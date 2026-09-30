import { defineCard } from "../define.js";

const TEXT = "{T}, Sacrifice this artifact: Exile target player's graveyard.";

export default defineCard({
  name: "Tormod's Crypt",
  manaCost: "{0}",
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "exile-graveyard", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
