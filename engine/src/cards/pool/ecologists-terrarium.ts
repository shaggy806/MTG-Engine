import { defineCard } from "../define.js";

export default defineCard({
  name: "Ecologist's Terrarium",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.\n{2}, {T}, Sacrifice this artifact: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this artifact enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
