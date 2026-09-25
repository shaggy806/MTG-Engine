import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

// #433 in top-commanders.txt.
//
// The exiled card may be played this turn (a land too); an Equipment spell
// among them may also be cast free.
const TEXT =
  "Whenever an equipped creature you control attacks, exile the top card of your library. You may play " +
  "that card this turn. You may cast Equipment spells this way without paying their mana costs.";

export default defineCard({
  name: "Nahiri, Forged in Fury",
  manaCost: "{4}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kor", "Artificer"],
  power: 5,
  toughness: 4,
  selfCostReduction: affinity({ subtype: "Equipment" }),
  text: `Affinity for Equipment (This spell costs {1} less to cast for each Equipment you control.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { equipped: true } },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        duration: "end-of-turn",
        free: { filter: { subtype: "Equipment" } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
