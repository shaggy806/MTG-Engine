import { defineCard } from "../define.js";

export default defineCard({
  name: "Volcanic Geyser",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Volcanic Geyser deals X damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: "x", target: 0 },
});
