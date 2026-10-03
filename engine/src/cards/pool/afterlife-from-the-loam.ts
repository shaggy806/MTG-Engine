import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const TEXT =
  "For each player, choose up to one target creature card in that player's graveyard. Put those cards onto the " +
  "battlefield under your control. They're Zombies in addition to their other types.";

// "For each player … in that player's graveyard": one optional slot per
// player, each bound to that player by seat (yours first; a game seats at
// most four). They enter together, under your control, each a Zombie for as
// long as it stays — in place as it enters, so "whenever a Zombie enters"
// sees one arrive.
const perPlayer = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "card-in-graveyard", whose: { seat }, filter: { type: "creature" } },
});

export default defineCard({
  name: "Afterlife from the Loam",
  manaCost: "{5}{B}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  delve: true,
  text: `Delve (Each card you exile from your graveyard while casting this spell pays for {1}.)\n${TEXT}`,
  targets: [perPlayer(0), perPlayer(1), perPlayer(2), perPlayer(3)],
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [0, 1, 2, 3].map((slot) => ({
      kind: "put-onto-battlefield" as const,
      target: slot,
      underYourControl: true,
      addSubtypes: ["Zombie"],
    })),
  },
});
