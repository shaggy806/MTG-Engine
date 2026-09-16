import { defineCard } from "../define.js";

export default defineCard({
  name: "Necrotic Hex",
  manaCost: "{6}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Each player sacrifices six creatures of their choice. You create six tapped " +
    "2/2 black Zombie creature tokens.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sacrifice",
        who: "each-player",
        filter: { type: "creature" },
        count: 6,
      },
      { kind: "create-token", token: "Zombie Token", count: 6, tapped: true },
    ],
  },
});
