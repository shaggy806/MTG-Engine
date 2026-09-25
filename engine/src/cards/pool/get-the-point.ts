import { defineCard } from "../define.js";

export default defineCard({
  name: "Get the Point",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text: "Destroy target creature. Scry 1.",
  targets: ["creature"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "scry", amount: 1 }] },
});
