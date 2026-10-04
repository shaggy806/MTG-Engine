import { defineCard } from "../define.js";

// EDHREC rank 4280.
// Bojuka Bog's `exile-graveyard` (rule 406: the whole graveyard is exiled as
// one action; its cards aren't targeted).

export default defineCard({
  name: "Angel of Finality",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, exile target player's graveyard.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "exile-graveyard", target: 0 },
      resolve: null,
      text: "When this creature enters, exile target player's graveyard.",
    },
  ],
});
