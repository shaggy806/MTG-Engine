import { defineCard } from "../define.js";

/** 3/3 colourless Golem artifact creature with trample — one of Triplicate
 * Titan's three. */
export default defineCard({
  name: "Golem Trample Token",
  art: "40c50c6d-5116-4acb-89d3-f27efb20d336",
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample",
});
