import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-6 — a `CardFilter`-gated `would-be-put-into-graveyard`
 * replacement (Anafenza-style graveyard hate), generalizing Rest in Peace's
 * global. The attacks trigger is simplified to "another target creature you
 * control" (drops the printed "tapped").
 */
export default defineCard({
  name: "Anafenza, the Foremost",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 4,
  toughness: 4,
  text:
    "Whenever Anafenza, the Foremost attacks, put a +1/+1 counter on another target creature you control.\n" +
    "If a creature card an opponent owns would be put into a graveyard from anywhere, exile it instead.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever Anafenza, the Foremost attacks, put a +1/+1 counter on another target creature you control.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-be-put-into-graveyard",
        instead: "exile",
        filter: { type: "creature", ownedBy: "opponent" },
      },
      text: "If a creature card an opponent owns would be put into a graveyard from anywhere, exile it instead.",
    },
  ],
});
