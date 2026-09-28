import { defineCard } from "../define.js";

export default defineCard({
  name: "Terminate",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text: "Destroy target creature. It can't be regenerated.",
  targets: ["creature"],
  effect: { kind: "destroy", target: 0, cantBeRegenerated: true },
});
