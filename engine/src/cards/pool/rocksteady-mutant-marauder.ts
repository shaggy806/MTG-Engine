import { defineCard } from "../define.js";

export default defineCard({
  name: "Rocksteady, Mutant Marauder",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rhino", "Mutant"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  pairing: { kind: "partner-with", name: "Bebop, Skull & Crossbones" },
  text: "Partner with Bebop, Skull & Crossbones (When this creature enters, target player may put Bebop into their hand from their library, then shuffle.)\nTrample\nWhenever another nontoken creature you control enters, put a +1/+1 counter on target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Bebop, Skull & Crossbones" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Bebop, Skull & Crossbones, reveal it, put it into their hand, then shuffle.",
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another nontoken creature you control enters, put a +1/+1 counter on target creature.",
    },
  ],
});
