import { defineCard } from "../define.js";

export default defineCard({
  name: "Return from the Wilds",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Choose two —\n• Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.\n• Create a 1/1 white Human creature token.\n• Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        text: "Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
        effect: {
          kind: "search-library",
          filter: { supertype: "basic", type: "land" },
          destination: "battlefield",
          min: 0,
          max: 1,
          enterTapped: true,
        },
      },
      {
        text: "Create a 1/1 white Human creature token.",
        effect: { kind: "create-token", token: "Human Token", count: 1 },
      },
      {
        text: "Create a Food token.",
        effect: { kind: "create-token", token: "Food Token", count: 1 },
      },
    ],
  },
});
