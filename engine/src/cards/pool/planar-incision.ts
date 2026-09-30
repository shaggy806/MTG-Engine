import { defineCard } from "../define.js";

// The counter is on it as it returns (rule 122.6), so its enters triggers
// see it.
export default defineCard({
  name: "Planar Incision",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile target artifact or creature, then return it to the battlefield under its owner's control with a +1/+1 counter on it.",
  targets: ["artifact-or-creature"],
  effect: { kind: "flicker", target: 0, thenCounters: { kind: "+1/+1", amount: 1, entering: true } },
});
