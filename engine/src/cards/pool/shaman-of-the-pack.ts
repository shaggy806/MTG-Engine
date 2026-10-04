import { defineCard } from "../define.js";

// EDHREC rank 4524.
//
// Rulings:
//   [2016-06-08] Count the number of Elves you control as Shaman of the Pack's ability resolves,
//     including Shaman of the Pack if it's still on the battlefield, to determine how much life is
//     lost.

const TEXT = "When this creature enters, target opponent loses life equal to the number of Elves you control.";

export default defineCard({
  name: "Shaman of the Pack",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 3,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      // Counted live as it resolves (the ruling).
      effect: { kind: "lose-life", target: 0, amount: { countOf: { subtype: "Elf", controlledBy: "you" } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
