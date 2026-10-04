import { defineCard } from "../define.js";

// Ancient Stone Idol's Construct token: a 6/12 colorless Construct artifact
// creature with trample.

export default defineCard({
  name: "Construct Token (Ancient Stone Idol)",
  art: "6627cf40-5f2d-4f5c-8511-5e6db8b56ebb",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 6,
  toughness: 12,
  keywords: ["trample"],
  text: "Trample",
});
