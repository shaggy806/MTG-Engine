import { defineCard } from "../define.js";

// A 1/1 red Warrior — mobilize's token (rule 702.181a). ("Warrior Token" is
// Najeela's white one; the engine keys tokens by name.)
export default defineCard({
  name: "Red Warrior Token",
  art: "7edc0515-a130-45a7-aa09-0e23bba41587",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Warrior"],
  power: 1,
  toughness: 1,
});
