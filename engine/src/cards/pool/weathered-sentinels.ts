import { defineCard } from "../define.js";

const ATTACK_PERMISSION_TEXT =
  "This creature can attack players who attacked you during their last turn as though it didn't have defender.";
const ATTACKS_TEXT = "Whenever this creature attacks, it gets +3/+3 and gains indestructible until end of turn.";

// "Players who attacked you": a player who declared a creature attacking
// you — not only your planeswalkers, and not a creature put onto the
// battlefield attacking (the O-Kagachi ruling on the same words) — during
// the most recent turn they took. Never a planeswalker: only players.
export default defineCard({
  name: "Weathered Sentinels",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 2,
  toughness: 5,
  keywords: ["defender", "reach", "vigilance", "trample"],
  text: `Defender, reach, vigilance, trample\n${ATTACK_PERMISSION_TEXT}\n${ATTACKS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      canAttackAsThoughNoDefender: "players-who-attacked-you",
      text: ATTACK_PERMISSION_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
          { kind: "grant-keyword", target: "source", keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ATTACKS_TEXT,
    },
  ],
});
