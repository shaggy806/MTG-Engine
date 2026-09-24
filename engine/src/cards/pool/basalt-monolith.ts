import { defineCard } from "../define.js";

export default defineCard({
  name: "Basalt Monolith",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text:
    "This artifact doesn't untap during your untap step.\n" +
    "{T}: Add {C}{C}{C}.\n" +
    "{3}: Untap this artifact.",
  static: [
    {
      affects: { scope: "self" },
      doesntUntap: true,
      text: "This artifact doesn't untap during your untap step.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 3 },
      resolve: null,
      text: "{T}: Add {C}{C}{C}.",
    },
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{3}: Untap this artifact.",
    },
  ],
});
