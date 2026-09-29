import { untappedEntryLand } from "../helpers.js";

export default untappedEntryLand("Idyllic Grange", "Plains", {
  text: "When this land enters untapped, put a +1/+1 counter on target creature you control.",
  targets: ["creature-you-control"],
  effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
});
