import { defineCard } from "../define.js";

/** 1/1 colorless Phyrexian Mite artifact creature with toxic 1 and "This
 * creature can't block" — White Sun's Twilight's and Mirrex's token. */
export default defineCard({
  name: "Phyrexian Mite Token",
  art: "a0b4b9cc-b0a4-4383-881b-e843e5d8a8c1",
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Mite"],
  power: 1,
  toughness: 1,
  toxic: 1,
  text: "Toxic 1 (Players dealt combat damage by this creature also get a poison counter.)\nThis creature can't block.",
  static: [{ affects: { scope: "self" }, restrictions: ["cant-block"], text: "This creature can't block." }],
});
