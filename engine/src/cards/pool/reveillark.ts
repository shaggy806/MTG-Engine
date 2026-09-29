import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// One instruction over both targets, so they return at once (`simultaneous`).
const LEAVES_TEXT =
  "When this creature leaves the battlefield, return up to two target creature cards with power 2 or less " +
  "from your graveyard to the battlefield.";
const smallCreatureCard: TargetSpec = {
  kind: "card-in-graveyard",
  whose: "you",
  filter: { type: "creature", power: { op: "lte", n: 2 } },
};

export default defineCard({
  name: "Reveillark",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  evoke: { cost: "{5}{W}" },
  text:
    `Flying\n${LEAVES_TEXT}\n` +
    "Evoke {5}{W} (You may cast this spell for its evoke cost. If you do, it's sacrificed when it enters.)",
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: distinctTargets(2, smallCreatureCard, { optional: true }),
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "put-onto-battlefield", target: 1 },
        ],
      },
      resolve: null,
      text: LEAVES_TEXT,
    },
  ],
});
