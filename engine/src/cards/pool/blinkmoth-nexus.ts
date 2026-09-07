import { defineCard } from "../define.js";

export default defineCard({
  name: "Blinkmoth Nexus",
  types: ["land"],
  text: "{T}: Add {C}.\n{1}: Blinkmoth Nexus becomes a 1/1 Blinkmoth artifact creature with flying until end of turn. It's still a land.",
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
        power: 1,
        toughness: 1,
        addTypes: ["artifact", "creature"],
        addSubtypes: ["Blinkmoth"],
        keywords: ["flying"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}: Blinkmoth Nexus becomes a 1/1 Blinkmoth artifact creature with flying until end of turn. It's still a land.",
    },
  ],
});
