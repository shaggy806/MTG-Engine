import { defineCard } from "../define.js";

// EDHREC rank 5434.

const TEXT = "{T}: You gain 1 life for each Elf on the battlefield.";

// Every Elf on the battlefield, whoever controls it, Wellwisher included.
export default defineCard({
  name: "Wellwisher",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: { countOf: { subtype: "Elf" } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
