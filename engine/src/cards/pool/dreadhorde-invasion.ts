import { defineCard } from "../define.js";

const UPKEEP_TEXT = "At the beginning of your upkeep, you lose 1 life and amass Zombies 1.";
const ATTACK_TEXT = "Whenever a Zombie token you control with power 6 or greater attacks, it gains lifelink until end of turn.";

export default defineCard({
  name: "Dreadhorde Invasion",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text:
    `${UPKEEP_TEXT} (Put a +1/+1 counter on an Army you control. It's also a Zombie. If you don't ` +
    `control an Army, create a 0/0 black Zombie Army creature token first.)\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1 },
          { kind: "amass", amount: 1, creatureType: "Zombie" },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
    {
      trigger: {
        on: "attacks",
        who: "you-control",
        filter: { subtype: "Zombie", token: true, power: { op: "gte", n: 6 } },
      },
      targets: [],
      effect: { kind: "grant-keyword", target: "trigger-object", keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
