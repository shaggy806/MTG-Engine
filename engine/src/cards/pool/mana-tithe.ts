import { defineCard } from "../define.js";

export default defineCard({
  name: "Mana Tithe",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {1}.",
  targets: ["spell"],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ pay: "{1}", text: "Pay {1}" }],
    otherwise: { kind: "counter", target: 0 },
  },
});
