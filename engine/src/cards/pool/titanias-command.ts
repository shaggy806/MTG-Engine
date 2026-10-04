import { defineCard } from "../define.js";

// EDHREC rank 4037.
// Makes Bear → uses the existing "Bear Token".
//
// Rulings:
//   [2022-10-14] If you choose the first mode and that player is an illegal target by the time
//     Titania's Command would resolve, the spell is removed from the stack and none of its effects
//     happen.

export default defineCard({
  name: "Titania's Command",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Choose two —\n• Exile target player's graveyard. You gain 1 life for each card exiled this way.\n• Search your library for up to two land cards, put them onto the battlefield tapped, then shuffle.\n• Create two 2/2 green Bear creature tokens.\n• Put two +1/+1 counters on each creature you control.",
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        text: "Exile target player's graveyard. You gain 1 life for each card exiled this way.",
        targets: ["player"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile-graveyard", target: 0 },
            { kind: "gain-life", amount: { thisWay: "exiled" } },
          ],
        },
      },
      {
        text: "Search your library for up to two land cards, put them onto the battlefield tapped, then shuffle.",
        targets: [],
        effect: {
          kind: "search-library",
          filter: { type: "land" },
          destination: "battlefield",
          enterTapped: true,
          min: 0,
          max: 2,
        },
      },
      {
        text: "Create two 2/2 green Bear creature tokens.",
        targets: [],
        effect: { kind: "create-token", token: "Bear Token", count: 2 },
      },
      {
        text: "Put two +1/+1 counters on each creature you control.",
        targets: [],
        effect: {
          kind: "add-counter-all",
          filter: { type: "creature", controlledBy: "you" },
          counter: "+1/+1",
          amount: 2,
        },
      },
    ],
  },
});
