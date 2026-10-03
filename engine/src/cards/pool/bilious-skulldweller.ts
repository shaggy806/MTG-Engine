import { defineCard } from "../define.js";

export default defineCard({
  name: "Bilious Skulldweller",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Insect"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  toxic: 1,
  text: "Deathtouch\nToxic 1 (Players dealt combat damage by this creature also get a poison counter.)",
});
