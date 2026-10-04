import { defineCard } from "../define.js";

// EDHREC rank 2664.
//
// Rulings:
//   [2024-11-08] Whenever a land you control enters, each landfall ability of the permanents you
//     control will trigger. You can put them   on the stack in any order. The last ability you put
//     on the stack will be the first one to resolve (As a result, you can have those abilities
//     resolve in the order of your choosing.).
//   [2024-11-08] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//   [2024-11-08] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.

const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, you may put a quest counter on this enchantment.";
const SAC_TEXT =
  "Remove three quest counters from this enchantment and sacrifice it: Search your library for up to two " +
  "basic land cards, put them onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Khalni Heart Expedition",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${LANDFALL_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a quest counter on Khalni Heart Expedition?",
        effect: { kind: "add-counter", target: "source", counter: "quest", amount: 1 },
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "quest", count: 3 }, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        min: 0,
        max: 2,
        destination: "battlefield",
        enterTapped: true,
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
