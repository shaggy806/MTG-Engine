import { defineCard } from "../define.js";

// EDHREC rank 3298.
// Makes Bird → use "Chocobo Bird Token".
//
// Rulings:
//   [2025-07-25] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.
//   [2025-07-25] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//   [2025-07-25] Whenever a land you control enters, each landfall ability of permanents you
//     control will trigger. You can put them on the stack in any order. The last ability you put
//     on the stack will be the first one to resolve. As a result, you can have those abilities
//     resolve in the order of your choosing.

export default defineCard({
  name: "Chocobo Racetrack",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["artifact"],
  text: "Landfall — Whenever a land you control enters, create a 2/2 green Bird creature token with \"Whenever a land you control enters, this token gets +1/+0 until end of turn.\"",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Chocobo Bird Token", count: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, create a 2/2 green Bird creature token with \"Whenever a land you control enters, this token gets +1/+0 until end of turn.\"",
    },
  ],
});
