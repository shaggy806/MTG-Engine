import { defineCard } from "../define.js";

export default defineCard({
  name: "Noxious Revival",
  manaCost: "{G/P}",
  colors: ["G"],
  types: ["instant"],
  text:
    "({G/P} can be paid with either {G} or 2 life.)\n" +
    "Put target card from a graveyard on top of its owner's library.",
  targets: [{ kind: "card-in-graveyard", whose: "any" }],
  effect: { kind: "put-on-library", target: 0, position: "top" },
});
