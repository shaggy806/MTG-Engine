import { defineCard } from "../define.js";

// Real text is "return **target** card from your graveyard to your hand". The
// engine has no `TargetSpec` for an arbitrary card in a graveyard (AUTHORING
// §15), so this is modelled as a non-targeted `return-from-graveyard` — the
// controller picks the card as the trigger resolves rather than as it goes on
// the stack. The only observable difference is rule 608.2b fizzling (a trigger
// whose only target became illegal), which nothing in the pool can cause for a
// card sitting in a graveyard.
export default defineCard({
  name: "Eternal Witness",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 1,
  text:
    "When Eternal Witness enters the battlefield, you may return target card from your " +
    "graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Return a card from your graveyard to your hand?",
        effect: {
          kind: "return-from-graveyard",
          filter: {},
          destination: "hand",
          count: 1,
        },
      },
      resolve: null,
      text:
        "When Eternal Witness enters the battlefield, you may return target card from your " +
        "graveyard to your hand.",
    },
  ],
});
