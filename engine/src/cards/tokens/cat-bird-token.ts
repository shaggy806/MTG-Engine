import { defineCard } from "../define.js";

/** 1/1 white Cat Bird with flying — Skycat Sovereign's token. */
export default defineCard({
  name: "Cat Bird Token",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});
