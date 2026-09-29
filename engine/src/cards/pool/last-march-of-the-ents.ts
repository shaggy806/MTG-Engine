import { defineCard } from "../define.js";

const TEXT =
  "Draw cards equal to the greatest toughness among creatures you control, then put any number of creature cards from your hand onto the battlefield.";

// The toughness is read as the draw happens, before anything is put onto
// the battlefield; "any number" is up to every creature card in hand then.
export default defineCard({
  name: "Last March of the Ents",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  cantBeCountered: true,
  text: `This spell can't be countered.\n${TEXT}`,
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "draw",
        amount: { aggregate: "max", of: "toughness", filter: { type: "creature", controlledBy: "you" } },
      },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: { cardsInHand: "you" },
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
      },
    ],
  },
});
