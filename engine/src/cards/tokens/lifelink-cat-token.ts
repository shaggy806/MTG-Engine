import { defineCard } from "../define.js";

// A 1/1 white Cat **with lifelink** — Leonin Warleader's token. ("Cat Token"
// is the 2/2 white one; the engine keys tokens by name.)
export default defineCard({
  name: "Lifelink Cat Token",
  art: "b31f1580-5bba-4cef-b0c8-f2837a597b7d",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink",
});
