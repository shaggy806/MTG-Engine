import { defineCard } from "../define.js";

// The target spell's controller decides (`chooser: 0` — the object in slot
// 0, so its controller), and the {2} rides on their decision.
export default defineCard({
  name: "Spell Pierce",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target noncreature spell unless its controller pays {2}.",
  targets: ["noncreature-spell"],
  effect: {
    kind: "unless",
    chooser: 0,
    options: [{ pay: "{2}", text: "Pay {2}" }],
    otherwise: { kind: "counter", target: 0 },
  },
});
