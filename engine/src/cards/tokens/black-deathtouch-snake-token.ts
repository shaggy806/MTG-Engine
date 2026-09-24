import { defineCard } from "../define.js";

/** 1/1 black Snake with deathtouch — Ophiomancer's token. */
export default defineCard({
  name: "Black Deathtouch Snake Token",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});
