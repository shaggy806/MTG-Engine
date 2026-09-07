import { defineCard } from "../define.js";

/** 2/2 white Knight with vigilance — made by History of Benalia (Phase 10). */
export default defineCard({
  name: "Knight Token",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Knight"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance",
});
