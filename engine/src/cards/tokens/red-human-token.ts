import { defineCard } from "../define.js";

// A 1/1 red Human — Hanweir Garrison's token. ("Human Token" is the white
// one; the engine keys tokens by name.)
export default defineCard({
  name: "Red Human Token",
  art: "5806617d-a621-434a-a2aa-756144efb67b",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
});
