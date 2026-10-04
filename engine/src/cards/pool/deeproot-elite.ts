import { defineCard } from "../define.js";

// EDHREC rank 5914.
//
// Rulings:
//   [2018-01-19] Deeproot Elite's ability can target the Merfolk that caused it to trigger. It can
//     also target Deeproot Elite itself.

export default defineCard({
  name: "Deeproot Elite",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Merfolk", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Whenever another Merfolk you control enters, put a +1/+1 counter on target Merfolk you control.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Merfolk" },
        otherOnly: true,
      },
      targets: [{ kind: "permanent", filter: { subtype: "Merfolk", controlledBy: "you" } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another Merfolk you control enters, put a +1/+1 counter on target Merfolk you control.",
    },
  ],
});
