import { defineCard } from "../define.js";

// Kura, the Boundless Sky's X/X green Spirit creature token: it prints 0/0 and
// gets its size from `create-token`'s `basePt` as it's made.

export default defineCard({
  name: "Spirit Token (Kura, the Boundless Sky)",
  art: "d237377d-b79b-4f27-a142-e2c1756e0d94",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 0,
  toughness: 0,
});
