import { defineCard } from "../define.js";

// X is Elenda's power as it last existed on the battlefield (rule 608.2h —
// the card's ruling). Dying alongside other creatures, her counter trigger
// still fires for each of them but finds her gone, so they don't add to X.
export default defineCard({
  name: "Elenda, the Dusk Rose",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text:
    "Lifelink\n" +
    "Whenever another creature dies, put a +1/+1 counter on Elenda.\n" +
    "When Elenda dies, create X 1/1 white Vampire creature tokens with lifelink, where X is " +
    "Elenda's power.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another creature dies, put a +1/+1 counter on Elenda.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Lifelink Vampire Token",
        count: { powerOf: "source" },
      },
      resolve: null,
      text:
        "When Elenda dies, create X 1/1 white Vampire creature tokens with lifelink, where X is " +
        "Elenda's power.",
    },
  ],
});
