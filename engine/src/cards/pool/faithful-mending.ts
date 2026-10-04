import { defineCard } from "../define.js";

// EDHREC rank 3768. Faithless Looting's shape, with the life gain first.

export default defineCard({
  name: "Faithful Mending",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  flashback: { cost: "{1}{W}{U}" },
  text: "You gain 2 life, draw two cards, then discard two cards.\nFlashback {1}{W}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-life", amount: 2 },
      { kind: "draw", amount: 2 },
      { kind: "discard", target: "you", amount: 2 },
    ],
  },
});
