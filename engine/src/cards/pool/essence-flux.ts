import { defineCard } from "../define.js";

export default defineCard({
  name: "Essence Flux",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target creature you control, then return that card to the battlefield under your control.",
  targets: ["creature-you-control"],
  effect: { kind: "flicker", target: 0 },
});
