import { defineCard } from "../define.js";

// Both leave and come back together.
export default defineCard({
  name: "Displace",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Exile up to two target creatures you control, then return those cards to the battlefield under their owner's control.",
  targets: [
    { kind: "optional", of: "creature-you-control" },
    { kind: "optional", of: { kind: "other", of: "creature-you-control", than: { slot: 0 } } },
  ],
  effect: { kind: "flicker", target: [0, 1] },
});
