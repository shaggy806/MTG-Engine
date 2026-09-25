import { defineCard } from "../define.js";

/** 1/1 black Fungus with "This token can't block" — The Mycotyrant's token. */
export default defineCard({
  name: "Fungus Token (Can't Block)",
  art: "73ff66e3-ea24-4542-887f-c41abb1759e6",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 1,
  toughness: 1,
  text: "This token can't block.",
  static: [{ affects: { scope: "self" }, restrictions: ["cant-block"], text: "This token can't block." }],
});
