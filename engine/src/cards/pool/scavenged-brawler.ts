import { defineCard } from "../define.js";

// EDHREC rank 3991.

const TEXT =
  "{5}, Exile this card from your graveyard: Choose target creature. Put four +1/+1 counters, a flying counter, a vigilance counter, a trample counter, and a lifelink counter on that creature. Activate only as a sorcery.";

export default defineCard({
  name: "Scavenged Brawler",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance", "trample", "lifelink"],
  text: `Flying, vigilance, trample, lifelink\n${TEXT}`,
  activated: [
    {
      // `zone: "graveyard"` pays "Exile this card from your graveyard" (Qarsi
      // Revenant's renew). Keyword counters (rule 122.1b).
      cost: { mana: "{5}", tap: false },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 4 },
          { kind: "add-counter", target: 0, counter: "flying", amount: 1 },
          { kind: "add-counter", target: 0, counter: "vigilance", amount: 1 },
          { kind: "add-counter", target: 0, counter: "trample", amount: 1 },
          { kind: "add-counter", target: 0, counter: "lifelink", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});
