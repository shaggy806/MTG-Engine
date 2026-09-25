import { defineCard } from "../define.js";

export default defineCard({
  name: "Serpent's Gift",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy it.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
});
