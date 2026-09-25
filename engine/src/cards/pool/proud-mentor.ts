import { defineCard } from "../define.js";

export default defineCard({
  name: "Proud Mentor",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 1,
  toughness: 1,
  pairing: { kind: "partner-with", name: "Impetuous Protege" },
  text: "Partner with Impetuous Protege (When this creature enters, target player may put Impetuous Protege into their hand from their library, then shuffle.)\n{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{W}, {T}: Tap target creature.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Impetuous Protege" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Impetuous Protege, reveal it, put it into their hand, then shuffle.",
    },
  ],
});
