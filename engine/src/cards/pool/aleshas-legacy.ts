import { defineCard } from "../define.js";

export default defineCard({
  name: "Alesha's Legacy",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature you control gains deathtouch and indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
});
