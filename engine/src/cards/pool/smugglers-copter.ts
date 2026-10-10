import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";
import type { TriggeredAbility } from "../../abilities.js";

// EDHREC rank 1909. "Attacks or blocks" is two triggers, one per event.
const LOOT = "Whenever this Vehicle attacks or blocks, you may draw a card. If you do, discard a card.";

const loot = (on: "attacks" | "blocks"): TriggeredAbility => ({
  trigger: { on, who: "self" },
  targets: [],
  effect: {
    kind: "may",
    prompt: "Draw a card, then discard a card?",
    effect: { kind: "draw", amount: 1 },
    then: { kind: "discard", target: "you", amount: 1 },
  },
  resolve: null,
  text: LOOT,
});

export default defineCard({
  name: "Smuggler's Copter",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${LOOT}\n${crewText(1)}`,
  triggered: [loot("attacks"), loot("blocks")],
  activated: [crew(1, crewText(1))],
});
