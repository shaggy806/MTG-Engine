import { defineCard } from "../define.js";

/** 1/1 black Rat with "This token can't block" — Song of Totentanz's token. */
export default defineCard({
  name: "Rat Token (Can't Block)",
  art: "1e0205f2-25c1-403b-b408-56e3f2d63b4d",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat"],
  power: 1,
  toughness: 1,
  text: "This token can't block.",
  static: [{ affects: { scope: "self" }, restrictions: ["cant-block"], text: "This token can't block." }],
});
