import { defineCard } from "../define.js";

// EDHREC rank 4917.

const TEXT =
  "Synaptic Disintegrator — When this creature enters, destroy up to one target creature and target player mills three cards.";

export default defineCard({
  name: "Necron Deathmark",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Necron"],
  power: 5,
  toughness: 3,
  keywords: ["flash"],
  text: `Flash\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "creature" }, "player"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "mill", target: 1, amount: 3 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
