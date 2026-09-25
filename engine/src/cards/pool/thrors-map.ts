import { defineCard } from "../define.js";

export default defineCard({
  name: "Thrór's Map",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: "When Thrór's Map enters, search your library for a basic land card, reveal it, put it into your hand, then shuffle.\n{2}, {T}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{2}, {T}: Draw a card, then discard a card.",
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
      text: "When Thrór's Map enters, search your library for a basic land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
