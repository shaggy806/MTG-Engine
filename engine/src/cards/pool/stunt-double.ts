import { defineCard } from "../define.js";

export default defineCard({
  name: "Stunt Double",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 0,
  toughness: 0,
  keywords: ["flash"],
  text: "Flash\nYou may have this creature enter as a copy of any creature on the battlefield.",
  copyOnEnter: { filter: { type: "creature" } },
});
