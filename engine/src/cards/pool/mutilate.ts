import { defineCard } from "../define.js";

// EDHREC rank 2418.
//
// Defile's count, over every creature: the Swamps are counted as it resolves
// and only the creatures there then are affected; neither changes later in
// the turn (its ruling).
const SWAMPS = { product: [{ countOf: { subtype: "Swamp", controlledBy: "you" } }, -1] } as const;

export default defineCard({
  name: "Mutilate",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "All creatures get -1/-1 until end of turn for each Swamp you control.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature" },
    power: SWAMPS,
    toughness: SWAMPS,
    duration: "end-of-turn",
  },
});
