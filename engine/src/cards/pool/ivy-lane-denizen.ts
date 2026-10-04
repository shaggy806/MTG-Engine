import { defineCard } from "../define.js";

// EDHREC rank 2471.
//
// Rulings:
//   [2020-11-10] Ivy Lane Denizen can be chosen as the target of its own ability.
//   [2020-11-10] The green creature that entered the battlefield can be chosen as the target of
//     Ivy Lane Denizen's ability.

export default defineCard({
  name: "Ivy Lane Denizen",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 3,
  text: "Whenever another green creature you control enters, put a +1/+1 counter on target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature", colors: ["G"] }, otherOnly: true },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another green creature you control enters, put a +1/+1 counter on target creature.",
    },
  ],
});
