import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

// needed-cards P8 — the `exile-graveyard` effect (rule 406: exiling a whole
// graveyard is one action, not a sequence of targeted exiles, so the cards in
// it are never individually targeted).
export default defineCard({
  name: "Bojuka Bog",
  types: ["land"],
  text:
    "Bojuka Bog enters the battlefield tapped.\n" +
    "When Bojuka Bog enters the battlefield, exile target player's graveyard.\n" +
    "{T}: Add {B}.",
  static: [entersTappedStatic("Bojuka Bog")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "exile-graveyard", target: 0 },
      resolve: null,
      text: "When Bojuka Bog enters the battlefield, exile target player's graveyard.",
    },
  ],
  activated: [manaTapAbility("B")],
});
