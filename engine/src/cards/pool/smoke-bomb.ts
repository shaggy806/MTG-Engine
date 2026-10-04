import { defineCard } from "../define.js";

// EDHREC rank 4768.
//
// Rulings:
//   [2024-07-05] You don’t choose a target for Smoke Bomb’s last ability at the time it triggers.
//     Rather, a second “reflexive” ability triggers when you sacrifice Smoke Bomb this way. You
//     choose a target for that ability as it goes on the stack. Each player may respond to this
//     triggered ability as normal.
// "Sacrifice this. When you do, …" is Obscura Storefront's `sacrifice-source`
// with a reflexive `then`; the target is chosen as that reflexive ability goes
// on the stack (the ruling). "Can't be blocked this turn" is Access Tunnel's.
const SHROUD_TEXT = "All creatures have shroud. (They can't be the targets of spells or abilities.)";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, sacrifice this artifact. When you do, target creature you control can't be blocked this turn.";

export default defineCard({
  name: "Smoke Bomb",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  keywords: ["flash"],
  text: `Flash\n${SHROUD_TEXT}\n${UPKEEP_TEXT}`,
  static: [{ affects: { scope: "all-creatures" }, grantKeywords: ["shroud"], text: SHROUD_TEXT }],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sacrifice-source",
        then: {
          kind: "reflexive-trigger",
          targets: ["creature-you-control"],
          effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
          text: "Target creature you control can't be blocked this turn.",
        },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
