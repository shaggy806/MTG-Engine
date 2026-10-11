import { defineCard } from "../define.js";

// EDHREC rank 6728.
//
// Rulings:
//   Since none of the modes have targets, you don't have to choose which creature is getting the
//     counters or which cards you're returning until Gix's Command resolves.
//
// Modes are chosen as it's cast (rules 601.2b, 700.2a — `castModal`), and the
// chosen two happen in printed order (700.2d / 608.2c): counters put on a
// 2-power creature by the first mode save it from the second. Nothing
// targets, so each choice is made as it resolves: the creature for the
// counters (`choose-permanents`, any creature — not only yours), the creature
// cards to return (`look-and-choose`, none to two, moved together), and each
// opponent's sacrifice among its own creatures tied for greatest power
// (Crackling Doom's shape).

const COUNTERS = "Put two +1/+1 counters on up to one creature. It gains lifelink until end of turn.";
const DESTROY = "Destroy each creature with power 2 or less.";
const RETURN = "Return up to two creature cards from your graveyard to your hand.";
const SACRIFICE = "Each opponent sacrifices a creature with the greatest power among creatures they control.";

export default defineCard({
  name: "Gix's Command",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: `Choose two —\n• ${COUNTERS}\n• ${DESTROY}\n• ${RETURN}\n• ${SACRIFICE}`,
  castModal: {
    minModes: 2,
    maxModes: 2,
    modes: [
      {
        targets: [],
        text: COUNTERS,
        effect: {
          kind: "choose-permanents",
          filter: { type: "creature" },
          upTo: 1,
          then: {
            kind: "sequence",
            effects: [
              { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
              { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
            ],
          },
          prompt: "Put two +1/+1 counters on up to one creature",
        },
      },
      {
        targets: [],
        text: DESTROY,
        effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "lte", n: 2 } } },
      },
      {
        targets: [],
        text: RETURN,
        effect: {
          kind: "look-and-choose",
          zone: "graveyard",
          min: 0,
          max: 2,
          destination: "hand",
          leftover: "stay",
          filter: { type: "creature" },
        },
      },
      {
        targets: [],
        text: SACRIFICE,
        effect: {
          kind: "sacrifice",
          who: "each-opponent",
          filter: { type: "creature", greatestAmongItsController: { of: "power", among: { type: "creature" } } },
          count: 1,
        },
      },
    ],
  },
});
