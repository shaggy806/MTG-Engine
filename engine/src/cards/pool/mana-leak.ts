import { defineCard } from "../define.js";

export default defineCard({
  name: "Mana Leak",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {3}.",
  targets: ["spell"],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ pay: "{3}", text: "Pay {3}" }],
    otherwise: { kind: "counter", target: 0 },
  },
});
