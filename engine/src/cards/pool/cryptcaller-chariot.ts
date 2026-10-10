import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 4485. Once per discard event, however many cards it took.
const ZOMBIES = "Whenever you discard one or more cards, create that many tapped 2/2 black Zombie creature tokens.";

export default defineCard({
  name: "Cryptcaller Chariot",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 5,
  toughness: 5,
  keywords: ["menace"],
  text: `Menace\n${ZOMBIES}\nCrew 2`,
  triggered: [
    {
      trigger: { on: "discards", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: { triggerValue: true }, tapped: true },
      resolve: null,
      text: ZOMBIES,
    },
  ],
  activated: [crew(2)],
});
