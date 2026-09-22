import { defineCard } from "../define.js";

export default defineCard({
  name: "Essence Flux",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Exile target creature you control, then return that card to the battlefield " +
    "under its owner's control. If it's a Spirit, put a +1/+1 counter on it.",
  targets: ["creature-you-control"],
  // The Spirit check reads the *returned* permanent (rule 400.7 — a new
  // object), which is what `thenCounters.onlyIf` is evaluated against.
  effect: {
    kind: "flicker",
    target: 0,
    thenCounters: { kind: "+1/+1", amount: 1, onlyIf: { subtype: "Spirit" } },
  },
});
