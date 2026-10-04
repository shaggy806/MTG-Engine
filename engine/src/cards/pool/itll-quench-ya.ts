import { defineCard } from "../define.js";

// EDHREC rank 3744.

export default defineCard({
  name: "It'll Quench Ya!",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Lesson"],
  text: "Counter target spell unless its controller pays {2}.",
  targets: ["spell"],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ pay: "{2}", text: "Pay {2}" }],
    otherwise: { kind: "counter", target: 0 },
  },
});
