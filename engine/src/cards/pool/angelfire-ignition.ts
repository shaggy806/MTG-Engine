import { defineCard } from "../define.js";

// EDHREC rank 4970.

const KEYWORDS = ["vigilance", "trample", "lifelink", "indestructible", "haste"] as const;

export default defineCard({
  name: "Angelfire Ignition",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  types: ["sorcery"],
  flashback: { cost: "{2}{R}{W}" },
  text: "Put two +1/+1 counters on target creature. It gains vigilance, trample, lifelink, indestructible, and haste until end of turn.\nFlashback {2}{R}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      ...KEYWORDS.map((keyword) => ({
        kind: "grant-keyword" as const,
        target: 0,
        keyword,
        duration: "end-of-turn" as const,
      })),
    ],
  },
});
