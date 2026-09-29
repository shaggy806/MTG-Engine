import { defineCard } from "../define.js";

const UPKEEP_TEXT =
  'At the beginning of each upkeep, create a 1/1 black and green Pest creature token with "When this token dies, you gain 1 life."';
const UNTAP_TEXT = "Pay 10 life: Untap all lands you control. Activate only once each turn.";

export default defineCard({
  name: "Beledros Witherbloom",
  manaCost: "{5}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${UPKEEP_TEXT}\n${UNTAP_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: { kind: "create-token", token: "Pest Token", count: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 10 },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "untap-all", filter: { type: "land", controlledBy: "you" } },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
