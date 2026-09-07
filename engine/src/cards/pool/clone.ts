import { defineCard } from "../define.js";

export default defineCard({
  name: "Clone",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 0,
  toughness: 0,
  text: "You may have Clone enter the battlefield as a copy of any creature on the battlefield.",
  copyOnEnter: { filter: "creature" },
});
