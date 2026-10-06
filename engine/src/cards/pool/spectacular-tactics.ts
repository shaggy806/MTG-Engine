import { defineCard } from "../define.js";

const COUNTER_TEXT = "Put a +1/+1 counter on target creature you control. It gains hexproof until end of turn.";
const DESTROY_TEXT = "Destroy target creature with power 4 or greater.";

// Both modes target, so it's a cast-time `castModal` (Abrade's shape).
export default defineCard({
  name: "Spectacular Tactics",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: `Choose one —\n• ${COUNTER_TEXT}\n• ${DESTROY_TEXT}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: COUNTER_TEXT,
        targets: ["creature-you-control"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
            { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
          ],
        },
      },
      {
        text: DESTROY_TEXT,
        targets: [{ kind: "permanent", filter: { type: "creature", power: { op: "gte", n: 4 } } }],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
