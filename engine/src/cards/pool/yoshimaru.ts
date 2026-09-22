import { defineCard } from "../define.js";

// Top-commanders rank 124. "Permanent" is the whole point of the trigger — a
// legendary land, artifact, enchantment or planeswalker feeds it just as a
// legendary creature does — so the filter carries no type clause, only
// `supertype`. Nothing in the engine grants or removes the legendary
// supertype (no layer touches supertypes), so reading it off the printed card
// is exact even for a clone, which reports its copied name.
//
// Partner is read off the rules text by `validateCommanderDeck`, so the
// reminder line is the whole of it here — there is no `partner` keyword.
export default defineCard({
  name: "Yoshimaru, Ever Faithful",
  manaCost: "{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 1,
  text:
    "Whenever another legendary permanent you control enters, put a +1/+1 counter on Yoshimaru.\n" +
    "Partner (You can have two commanders if both have partner.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { supertype: "legendary" },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text:
        "Whenever another legendary permanent you control enters, put a +1/+1 counter on " +
        "Yoshimaru.",
    },
  ],
});
