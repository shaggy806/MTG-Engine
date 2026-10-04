import { defineCard } from "../define.js";

// EDHREC rank 3004.
// Makes Eldrazi Spawn → use "Eldrazi Spawn Token".

export default defineCard({
  name: "Malevolent Rumble",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Reveal the top four cards of your library. You may put a permanent card from among them into your hand. Put the rest into your graveyard. Create a 0/1 colorless Eldrazi Spawn creature token with \"Sacrifice this token: Add {C}.\"",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: true,
        min: 0,
        max: 1,
        destination: "hand",
        leftover: "graveyard",
        filter: { notTypes: ["instant", "sorcery"] },
      },
      { kind: "create-token", token: "Eldrazi Spawn Token", count: 1 },
    ],
  },
});
