import { defineCard } from "../define.js";

// EDHREC rank 4097.
//
// Earthbend is the `earthbend` effect (Earthbender Ascension, Aang).

export default defineCard({
  name: "Haru, Hidden Talent",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Peasant", "Ally"],
  power: 1,
  toughness: 1,
  text: "Whenever another Ally you control enters, earthbend 1. (Target land you control becomes a 0/0 creature with haste that's still a land. Put a +1/+1 counter on it. When it dies or is exiled, return it to the battlefield tapped.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Ally" },
        otherOnly: true,
      },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 1 },
      resolve: null,
      text: "Whenever another Ally you control enters, earthbend 1.",
    },
  ],
});
