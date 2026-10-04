import { defineCard } from "../define.js";

// EDHREC rank 6006.
// X is the mana actually spent to cast it (the rulings): four for its mana
// cost, seven with flashback, 0 for a free cast or a copy — `manaSpentOf`.

export default defineCard({
  name: "Memory Deluge",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  flashback: { cost: "{5}{U}{U}" },
  text: "Look at the top X cards of your library, where X is the amount of mana spent to cast this spell. Put two of them into your hand and the rest on the bottom of your library in a random order.\nFlashback {5}{U}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: { manaSpentOf: "source" },
    min: 2,
    max: 2,
    destination: "hand",
    leftover: "bottom-random",
  },
});
