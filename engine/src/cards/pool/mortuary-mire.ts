import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Mortuary Mire",
  types: ["land"],
  text:
    "Mortuary Mire enters the battlefield tapped.\n" +
    "When Mortuary Mire enters, you may put target creature card from your graveyard on top of your library.\n" +
    "{T}: Add {B}.",
  static: [entersTappedStatic("Mortuary Mire")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // "**You may** put target …" — an optional target slot rather than a
      // `may`, so declining is just leaving the slot empty and the trigger
      // never fizzles for want of a creature card in the graveyard.
      targets: [
        {
          kind: "optional",
          of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } },
        },
      ],
      effect: { kind: "put-on-library", target: 0, position: "top" },
      resolve: null,
      text: "When Mortuary Mire enters, you may put target creature card from your graveyard on top of your library.",
    },
  ],
  activated: [manaTapAbility("B")],
});
