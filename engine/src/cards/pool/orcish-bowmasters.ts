import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// One printed ability with two trigger conditions, authored as the two
// triggers it is. "Then amass Orcs 1" is part of the same targeted ability:
// if the target is illegal on resolution the whole thing does nothing, no
// Army included (the 2023-06-16 ruling). The draw half is Xyris's
// `exceptFirstInDrawStep` — only the opponent's own draw step's first card is
// exempt; a draw on anyone else's turn counts.
const TEXT =
  "When this creature enters and whenever an opponent draws a card except the first one they " +
  "draw in each of their draw steps, this creature deals 1 damage to any target. Then amass " +
  "Orcs 1.";

const PING_THEN_AMASS: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "damage", amount: 1, target: 0 },
    { kind: "amass", amount: 1, creatureType: "Orc" },
  ],
};

export default defineCard({
  name: "Orcish Bowmasters",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Orc", "Archer"],
  power: 1,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash\n" + TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["any-target"],
      effect: PING_THEN_AMASS,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "draws", who: "opponent", exceptFirstInDrawStep: true },
      targets: ["any-target"],
      effect: PING_THEN_AMASS,
      resolve: null,
      text: TEXT,
    },
  ],
});
