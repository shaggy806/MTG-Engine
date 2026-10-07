import { defineCard } from "../define.js";

// The active player chooses first, then each other player in turn order,
// knowing the choices before them; then every creature not chosen is
// sacrificed at once (the rulings). A negative power subtracts from the total.
export default defineCard({
  name: "Slaughter the Strong",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Each player chooses any number of creatures they control with total power 4 or less, " +
    "then sacrifices all other creatures they control.",
  effect: {
    kind: "keep-total-power",
    who: "each-player",
    filter: { type: "creature" },
    maxTotalPower: 4,
    prompt: "Choose creatures with total power 4 or less to keep; the rest are sacrificed",
  },
});
