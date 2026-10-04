import { defineCard } from "../define.js";

// EDHREC rank 6211.
//
// "During your turn" is part of the trigger condition (rule 603.1) — Crawling
// Infestation's `whileCondition` — so an artifact leaving on an opponent's
// turn neither triggers it nor uses up its once.
const LEAVE_TEXT =
  "Whenever one or more artifacts you control leave the battlefield during your turn, create a 1/1 colorless Construct artifact creature token. This ability triggers only once each turn.";
const SAC_TEXT = "{T}, Sacrifice an artifact: This artifact deals 1 damage to each opponent. You gain 1 life.";

export default defineCard({
  name: "Oni-Cult Anvil",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["artifact"],
  text: `${LEAVE_TEXT}\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "damage", amount: 1, who: "each-opponent" }, { kind: "gain-life", amount: 1 }],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "you-control", filter: { type: "artifact" } },
      whileCondition: { kind: "your-turn" },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Construct Token (Jan Jansen, Chaos Crafter)", count: 1 },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
