import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Wurm Token (Deathtouch)",
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Wurm"],
  power: 3,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
