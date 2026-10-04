import { defineCard } from "../define.js";

// EDHREC rank 2736.

export default defineCard({
  name: "Miscast",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target instant or sorcery spell unless its controller pays {3}.",
  targets: [{ kind: "spell", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ pay: "{3}", text: "Pay {3}" }],
    otherwise: { kind: "counter", target: 0 },
  },
});
