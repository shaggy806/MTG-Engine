import { defineCard } from "../define.js";

export default defineCard({
  name: "Grim Monolith",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text:
    "This artifact doesn't untap during your untap step.\n" +
    "{T}: Add {C}{C}{C}.\n" +
    "{4}: Untap this artifact.",
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
      cost: { mana: "{4}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{4}: Untap this artifact.",
    },
  ],
});
