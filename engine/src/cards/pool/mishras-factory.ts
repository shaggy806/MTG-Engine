import { defineCard } from "../define.js";

export default defineCard({
  name: "Mishra's Factory",
  types: ["land"],
  text: "{T}: Add {C}.\n{1}: Mishra's Factory becomes a 2/2 Assembly-Worker artifact creature until end of turn. It's still a land.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 2,
        toughness: 2,
        addTypes: ["artifact", "creature"],
        addSubtypes: ["Assembly-Worker"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}: Mishra's Factory becomes a 2/2 Assembly-Worker artifact creature until end of turn. It's still a land.",
    },
  ],
});
