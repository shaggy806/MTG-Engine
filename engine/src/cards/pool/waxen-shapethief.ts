import { defineCard } from "../define.js";

// EDHREC rank 5995.

export default defineCard({
  name: "Waxen Shapethief",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 0,
  toughness: 0,
  keywords: ["flash"],
  cycling: { cost: "{2}" },
  text: "Flash\nYou may have this creature enter as a copy of an artifact or creature you control.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  copyOnEnter: { filter: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" } },
});
