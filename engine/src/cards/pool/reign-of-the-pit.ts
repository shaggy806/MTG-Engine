import { defineCard } from "../define.js";

// X is the sacrificed creatures' power as they last existed on the
// battlefield, a negative power counting as negative (the ruling) — a total
// below 1 makes a Demon that dies at once.
const X = { thisWay: "sacrificed", sumOf: "power" } as const;

export default defineCard({
  name: "Reign of the Pit",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Each player sacrifices a creature of their choice. Create an X/X black Demon creature token with flying, " +
    "where X is the total power of the creatures sacrificed this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 1 },
      { kind: "create-token", token: "X/X Demon Token (Flying)", count: 1, basePt: { power: X, toughness: X } },
    ],
  },
});
