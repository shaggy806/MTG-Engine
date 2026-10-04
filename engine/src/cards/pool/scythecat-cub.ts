import { defineCard } from "../define.js";

// EDHREC rank 2850.
//
// Rulings:
//   [2024-11-08] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.
//   [2024-11-08] Whenever a land you control enters, each landfall ability of the permanents you
//     control will trigger. You can put them   on the stack in any order. The last ability you put
//     on the stack will be the first one to resolve (As a result, you can have those abilities
//     resolve in the order of your choosing.).
//   [2024-11-08] To double the number of +1/+1 counters on a creature, put a number of +1/+1
//     counters on it equal to the number it already has. Other cards that interact with putting
//     counters on it will interact with this effect accordingly.
//   [2024-11-08] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.

export default defineCard({
  name: "Scythecat Cub",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample\nLandfall — Whenever a land you control enters, put a +1/+1 counter on target creature you control. If this is the second time this ability has resolved this turn, double the number of +1/+1 counters on that creature instead.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["creature-you-control"],
      effect: {
        kind: "conditional",
        condition: { kind: "resolved-this-turn", n: 2 },
        then: { kind: "double-counters", target: 0, counter: "+1/+1" },
        else: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, put a +1/+1 counter on target creature you control. If this is the second time this ability has resolved this turn, double the number of +1/+1 counters on that creature instead.",
    },
  ],
});
