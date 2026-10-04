import { defineCard } from "../define.js";

// EDHREC rank 6398.
// "Your choice of" is chosen on resolution: an un-announced `modal`
// (Steel Seraph's shape).

const TEXT = "{1}: This creature gains your choice of flying, deathtouch, or lifelink until end of turn.";

export default defineCard({
  name: "Assassin Initiate",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: "Flying", effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" } },
          { text: "Deathtouch", effect: { kind: "grant-keyword", target: "source", keyword: "deathtouch", duration: "end-of-turn" } },
          { text: "Lifelink", effect: { kind: "grant-keyword", target: "source", keyword: "lifelink", duration: "end-of-turn" } },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
