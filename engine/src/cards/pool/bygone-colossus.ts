import { defineCard } from "../define.js";


export default defineCard({
  name: "Bygone Colossus",
  manaCost: "{9}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Giant"],
  power: 9,
  toughness: 9,
  text: "Warp {3} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  warp: { cost: "{3}" },
});
