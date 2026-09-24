import { defineCard } from "../define.js";

/** 1/1 blue Squid with islandwalk — Chasm Skulker's token. */
export default defineCard({
  name: "Squid Token",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Squid"],
  power: 1,
  toughness: 1,
  keywords: ["islandwalk"],
  text: "Islandwalk",
});
