import { defineCard } from "../define.js";

export default defineCard({
  name: "Gaea's Gift",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Put a +1/+1 counter on target creature you control. It gains reach, trample, hexproof, and " +
    "indestructible until end of turn. (It can't be the target of spells or abilities your " +
    "opponents control. Damage and effects that say \"destroy\" don't destroy it.)",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "grant-keyword", target: 0, keyword: "reach", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
});
