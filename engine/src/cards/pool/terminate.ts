import { defineCard } from "../define.js";

// "It can't be regenerated" is a no-op here: regeneration isn't modeled, so
// nothing could have saved the creature anyway.
export default defineCard({
  name: "Terminate",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text: "Destroy target creature. It can't be regenerated.",
  targets: ["creature"],
  effect: { kind: "destroy", target: 0 },
});
