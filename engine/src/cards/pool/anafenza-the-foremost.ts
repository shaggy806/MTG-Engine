import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-6 — a `CardFilter`-gated `would-be-put-into-graveyard`
 * replacement (Anafenza-style graveyard hate), generalizing Rest in Peace's
 * global. "Another target tapped creature you control" is a filtered
 * permanent target — its fellow attackers are tapped, bar those with
 * vigilance.
 */
const ATTACK_TEXT =
  "Whenever Anafenza, the Foremost attacks, put a +1/+1 counter on another target tapped creature you control.";
const EXILE_TEXT =
  "If a creature card an opponent owns would be put into a graveyard from anywhere, exile it instead.";

export default defineCard({
  name: "Anafenza, the Foremost",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 4,
  toughness: 4,
  text: `${ATTACK_TEXT}\n${EXILE_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        { kind: "other", of: { kind: "permanent", whose: "you", filter: { type: "creature", tapped: true } } },
      ],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-be-put-into-graveyard",
        instead: "exile",
        filter: { type: "creature", ownedBy: "opponent", token: false },
      },
      text: EXILE_TEXT,
    },
  ],
});
