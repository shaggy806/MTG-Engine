import { defineCard } from "../define.js";

/** 2/2 white Cat Beast — Felidar Retreat's landfall token. Distinct from the
 * plain 2/2 `Cat Token`, which is not a Beast. */
export default defineCard({
  name: "Cat Beast Token",
  art: "322ef76e-e0f0-48d7-a6ad-5d4c1c9ccb2e",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Beast"],
  power: 2,
  toughness: 2,
});
