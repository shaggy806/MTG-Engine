import { defineCard } from "../define.js";

// EDHREC rank 5863.
//
// Every Zombie on the battlefield, whoever controls it (no `controlledBy`).

const TEXT = "{T}: Each player loses 1 life for each Zombie on the battlefield.";

export default defineCard({
  name: "Shepherd of Rot",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Cleric"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "lose-life", amount: { countOf: { subtype: "Zombie" } }, who: "each-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});
