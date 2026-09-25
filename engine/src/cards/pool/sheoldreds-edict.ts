import { defineCard } from "../define.js";

export default defineCard({
  name: "Sheoldred's Edict",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one —\n• Each opponent sacrifices a nontoken creature of their choice.\n• Each opponent sacrifices a creature token of their choice.\n• Each opponent sacrifices a planeswalker of their choice.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Each opponent sacrifices a nontoken creature of their choice.",
        effect: {
          kind: "sacrifice",
          who: "each-opponent",
          filter: { token: false, type: "creature" },
          count: 1,
        },
      },
      {
        text: "Each opponent sacrifices a creature token of their choice.",
        effect: {
          kind: "sacrifice",
          who: "each-opponent",
          filter: { token: true, type: "creature" },
          count: 1,
        },
      },
      {
        text: "Each opponent sacrifices a planeswalker of their choice.",
        effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "planeswalker" }, count: 1 },
      },
    ],
  },
});
