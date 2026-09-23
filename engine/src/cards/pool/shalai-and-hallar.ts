import { defineCard } from "../define.js";

export default defineCard({
  name: "Shalai and Hallar",
  manaCost: "{1}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel", "Elf"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text:
    "Flying, vigilance\n" +
    "Whenever one or more +1/+1 counters are put on a creature you control, Shalai and Hallar " +
    "deals that much damage to target opponent.",
  triggered: [
    {
      trigger: {
        on: "counters-put",
        who: "you-control",
        counter: "+1/+1",
        filter: { type: "creature" },
      },
      targets: ["opponent"],
      effect: { kind: "damage", amount: { triggerValue: true }, target: 0 },
      resolve: null,
      text:
        "Whenever one or more +1/+1 counters are put on a creature you control, Shalai and Hallar " +
        "deals that much damage to target opponent.",
    },
  ],
});
