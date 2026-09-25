import { defineCard } from "../define.js";

// "You may return target card": the card is a target, chosen as the trigger
// goes on the stack (so with an empty graveyard it never does — rule 603.3d);
// the "may" is at resolution.
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
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: {
        kind: "may",
        prompt: "Return the target card to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text:
        "When Eternal Witness enters the battlefield, you may return target card from your " +
        "graveyard to your hand.",
    },
  ],
});
