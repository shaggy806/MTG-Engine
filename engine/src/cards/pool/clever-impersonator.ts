import { defineCard } from "../define.js";

// A copied planeswalker enters with its printed loyalty (its ruling).
export default defineCard({
  name: "Clever Impersonator",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 0,
  toughness: 0,
  text: "You may have this creature enter as a copy of any nonland permanent on the battlefield.",
  copyOnEnter: { filter: { notTypes: ["land"] } },
});
