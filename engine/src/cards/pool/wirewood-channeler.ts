import { defineCard } from "../define.js";

// EDHREC rank 3482.
//
// "X mana of any one color" is `any-color` × X (Baldur's Gate); X counts every
// Elf on the battlefield, whoever controls it, this one included (Priest of
// Titania).

const TEXT = "{T}: Add X mana of any one color, where X is the number of Elves on the battlefield.";

export default defineCard({
  name: "Wirewood Channeler",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: { countOf: { subtype: "Elf" } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
