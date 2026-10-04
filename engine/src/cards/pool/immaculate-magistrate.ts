import { defineCard } from "../define.js";

// EDHREC rank 3383.
//
// Rulings:
//   [2020-11-10] The target creature doesn't have to be an Elf.
//   [2020-11-10] The number of counters to put on the target creature is determined only as
//     Immaculate Magistrate's ability resolves. Elves coming and going later won't cause that
//     creature to gain or lose +1/+1 counters.

const TEXT = "{T}: Put a +1/+1 counter on target creature for each Elf you control.";

export default defineCard({
  name: "Immaculate Magistrate",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: {
        kind: "add-counter",
        target: 0,
        counter: "+1/+1",
        amount: { countOf: { subtype: "Elf", controlledBy: "you" } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
