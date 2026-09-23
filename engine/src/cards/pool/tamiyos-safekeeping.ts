import { defineCard } from "../define.js";

export default defineCard({
  name: "Tamiyo's Safekeeping",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Target permanent you control gains hexproof and indestructible until end of turn. " +
    "You gain 2 life. (A permanent with hexproof and indestructible can't be the target " +
    "of spells or abilities your opponents control. Damage and effects that say " +
    '"destroy" don\'t destroy it.)',
  targets: [{ kind: "permanent", whose: "you", filter: {} }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      { kind: "gain-life", amount: 2 },
    ],
  },
});
