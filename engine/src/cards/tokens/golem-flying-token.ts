import { defineCard } from "../define.js";

/** 3/3 colourless Golem artifact creature with flying — one of Triplicate
 * Titan's three. */
export default defineCard({
  name: "Golem Flying Token",
  art: "c6a3a35a-ebd8-47e5-a5ed-c736b8bed968",
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying",
});
