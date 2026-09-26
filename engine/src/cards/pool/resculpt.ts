import { defineCard } from "../define.js";

// "Its controller" is the exiled permanent's controller as it last existed
// on the battlefield (rule 608.2h).
export default defineCard({
  name: "Resculpt",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile target artifact or creature. Its controller creates a 4/4 blue and red Elemental creature token.",
  targets: ["artifact-or-creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "create-token", token: "4/4 Blue Red Elemental Token", count: 1, who: "target-controller" },
    ],
  },
});
