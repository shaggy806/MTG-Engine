import { defineCard } from "../define.js";

// EDHREC rank 5973. X counts this Bobblehead too.
const MANA = "{T}: Add one mana of any color.";
const LOOK =
  "{3}, {T}: Look at the top X cards of your library, where X is the number of Bobbleheads you control. You may cast a spell with mana value 3 or less from among them without paying its mana cost. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Perception Bobblehead",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Bobblehead"],
  text: `${MANA}\n${LOOK}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: MANA,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "cast-now",
        from: { libraryTop: { countOf: { subtype: "Bobblehead", controlledBy: "you" } } },
        free: true,
        spell: { manaValue: { op: "lte", n: 3 } },
        rest: "bottom-random",
      },
      resolve: null,
      text: LOOK,
    },
  ],
});
