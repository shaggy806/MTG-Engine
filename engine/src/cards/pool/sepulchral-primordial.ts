import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, for each opponent, you may put up to one target creature card from that player's graveyard onto the battlefield under your control.";

// "For each opponent … that player's graveyard": one optional slot per
// opponent, each bound to that player by seat (a game seats at most four, so
// three opponents — the rulings: up to one target per opponent). Whether to
// put each is chosen as it resolves, and the ones put enter together (the
// ruling), under your control.
const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "card-in-graveyard", whose: { seat }, filter: { type: "creature" } },
});

export default defineCard({
  name: "Sepulchral Primordial",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 5,
  toughness: 4,
  keywords: ["intimidate"],
  text: `Intimidate (This creature can't be blocked except by artifact creatures and/or creatures that share a color with it.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [perOpponent(1), perOpponent(2), perOpponent(3)],
      effect: {
        kind: "look-and-choose",
        zone: "targets",
        min: 0,
        max: 3,
        destination: "battlefield",
        leftover: "stay",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
