import { defineCard } from "../define.js";

// Blinkmoth Nexus with infect. Summoning sickness is the land's: one that
// entered this turn and is animated can't attack or tap for mana (the rulings).
export default defineCard({
  name: "Inkmoth Nexus",
  types: ["land"],
  text: "{T}: Add {C}.\n{1}: This land becomes a 1/1 Phyrexian Blinkmoth artifact creature with flying and infect until end of turn. It's still a land. (It deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)",
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
        addSubtypes: ["Phyrexian", "Blinkmoth"],
        keywords: ["flying", "infect"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}: This land becomes a 1/1 Phyrexian Blinkmoth artifact creature with flying and infect until end of turn. It's still a land.",
    },
  ],
});
