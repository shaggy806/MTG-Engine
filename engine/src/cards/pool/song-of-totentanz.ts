import { defineCard } from "../define.js";

// The Rats exist by the time creatures gain haste, so they have it too.
export default defineCard({
  name: "Song of Totentanz",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: 'Create X 1/1 black Rat creature tokens with "This token can\'t block." Creatures you control gain haste until end of turn.',
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Rat Token (Can't Block)", count: "x" },
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "haste",
        duration: "end-of-turn",
      },
    ],
  },
});
