import { defineCard } from "../define.js";

/** 1/3 white Wall with defender — Rampart Architect's token. */
export default defineCard({
  name: "Wall Token",
  art: "9b154f90-cc26-4e45-b751-854e2017cd40",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender",
});
