import { defineCard } from "../define.js";

export default defineCard({
  name: "Forbidden Alchemy",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Look at the top four cards of your library. Put one of them into your hand and the rest into your graveyard.\n" +
    "Flashback {6}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  flashback: { cost: "{6}{B}" },
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 4,
    min: 1,
    max: 1,
    destination: "hand",
    leftover: "graveyard",
  },
});
