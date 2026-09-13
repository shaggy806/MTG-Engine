import { defineCard } from "../define.js";

// Drops "If it's a Spirit, put a +1/+1 counter on it" — `EffectApi.flicker`
// returns void, with no way for a `resolve` script to read back the new
// object it created, so there's nothing to hang a follow-up characteristics
// check on. needed-cards verification pass.
export default defineCard({
  name: "Essence Flux",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile target creature you control, then return that card to the battlefield under your control.",
  targets: ["creature-you-control"],
  effect: { kind: "flicker", target: 0 },
});
