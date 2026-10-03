import { defineCard } from "../define.js";

const STEAL =
  "Whenever this creature deals combat damage to a player, gain control of all artifacts that player controls.";
const UPKEEP = "At the beginning of your upkeep, if you control twenty or more artifacts, you win the game.";

// "That player" is the one dealt the damage, and the artifacts are the ones
// they control as the ability resolves; the control lasts indefinitely. The
// upkeep ability is an intervening-if (rule 603.4): checked as the upkeep
// begins and again as it resolves (the ruling).
export default defineCard({
  name: "Hellkite Tyrant",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 5,
  keywords: ["flying", "trample"],
  text: `Flying, trample\n${STEAL}\n${UPKEEP}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "gain-control-all",
        filter: { type: "artifact" },
        untilEndOfTurn: false,
        controlledBy: "trigger-player",
      },
      resolve: null,
      text: STEAL,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 20 },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
