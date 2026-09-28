import { defineCard } from "../define.js";

export default defineCard({
  name: "Wrap in Vigor",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Regenerate each creature you control.",
  effect: { kind: "regenerate-all", filter: { type: "creature", controlledBy: "you" } },
});
