import { defineCard } from "../define.js";

// EDHREC rank 4349.
//
// Rulings:
//   [2016-06-08] The number of Elves on the battlefield is counted only as Timberwatch Elf’s
//     ability resolves. If Timberwatch Elf is still on the battlefield, it’ll count itself.

const TEXT =
  "{T}: Target creature gets +X/+X until end of turn, where X is the number of Elves on the battlefield.";
// Every Elf permanent, whoever controls it, counted as the ability resolves.
const ELVES = { countOf: { subtype: "Elf" } } as const;

export default defineCard({
  name: "Timberwatch Elf",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: ELVES, toughness: ELVES, duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
