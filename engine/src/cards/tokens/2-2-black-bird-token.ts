import { defineCard } from "../define.js";

// A 2/2 black Bird with flying — Rendmaw, Creaking Nest's token. ("Bird
// Token" is Migratory Route's 1/1 white one and "2/2 Blue Bird Token" Swan
// Song's; the engine keys tokens by name.)
export default defineCard({
  name: "2/2 Black Bird Token",
  art: "c94d14b1-0038-4e90-9335-54aef2890486",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});
