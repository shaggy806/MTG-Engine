import { defineCard } from "../define.js";

/** 1/1 red, green and white Sand Warrior — Hazezon, Shaper of Sand's token. */
export default defineCard({
  name: "Sand Warrior Token",
  // The Outlaws of Thunder Junction Commander token Hazezon's own printing
  // lists among its parts.
  art: "f3e51b4d-3859-48c2-a409-0fc096a6d484",
  colors: ["R", "G", "W"],
  types: ["creature"],
  subtypes: ["Sand", "Warrior"],
  power: 1,
  toughness: 1,
});
