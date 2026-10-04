import { defineCard } from "../define.js";

// Lagomos, Hand of Hatred's Elemental token: a 2/1 red Elemental with trample and haste.

export default defineCard({
  name: "Elemental Token (Lagomos, Hand of Hatred)",
  art: "c6b2ff6f-d55a-4fa2-86be-e2e012267de4",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 1,
  keywords: ["trample", "haste"],
  text: "Trample, haste",
});
