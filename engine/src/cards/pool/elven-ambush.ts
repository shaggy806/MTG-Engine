import { defineCard } from "../define.js";

// EDHREC rank 2810.
// Rulings:
//   [2021-02-05] Use the number of Elves you control as Elven Ambush resolves to determine how
//     many Elf Warrior tokens to create.

export default defineCard({
  name: "Elven Ambush",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Create a 1/1 green Elf Warrior creature token for each Elf you control.",
  effect: {
    kind: "create-token",
    token: "Elf Warrior Token",
    count: { countOf: { subtype: "Elf", controlledBy: "you" } },
  },
});
