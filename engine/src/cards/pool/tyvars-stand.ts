import { defineCard } from "../define.js";

export default defineCard({
  name: "Tyvar's Stand",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Target creature you control gets +X/+X and gains hexproof and indestructible until end of turn. " +
    "(It can't be the target of spells or abilities your opponents control. Damage and effects that say \"destroy\" don't destroy it.)",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: "x", toughness: "x", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
});
