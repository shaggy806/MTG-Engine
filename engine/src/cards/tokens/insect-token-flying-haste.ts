import { defineCard } from "../define.js";

/** 1/1 blue and red Insect with flying and haste — The Locust God's token. */
export default defineCard({
  name: "Insect Token (Flying, Haste)",
  art: "aeefb1d3-446f-4f07-9650-5b8c929f1ac9",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "haste"],
  text: "Flying, haste",
});
