import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever this creature attacks, choose up to one target nonland permanent. Its controller may sacrifice it. If they don't, this creature deals 5 damage to that player.";
const BLITZ_TEXT =
  'Blitz {3}{R} (If you cast this spell for its blitz cost, it gains haste and "When this creature dies, draw a card." Sacrifice it at the beginning of the next end step.)';

export default defineCard({
  name: "Star Athlete",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: `Menace\n${ATTACK_TEXT}\n${BLITZ_TEXT}`,
  blitz: { cost: "{3}{R}" },
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "optional", of: "nonland-permanent" }],
      // The permanent's controller decides; the damage is to them as they
      // last controlled it (rule 608.2h) — and with no target chosen, there
      // is no one to ask and nothing happens.
      effect: {
        kind: "each-player-may",
        who: { controllerOfTarget: 0 },
        prompt: "Sacrifice it? (If you don't, Star Athlete deals 5 damage to you.)",
        effect: { kind: "sacrifice-target", target: 0 },
        ifDidnt: { kind: "damage", amount: 5, who: "that-player" },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
