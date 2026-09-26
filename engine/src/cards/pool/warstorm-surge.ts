import { defineCard } from "../define.js";

const TEXT = "Whenever a creature you control enters, it deals damage equal to its power to any target.";

// The entering creature deals the damage (`from: "trigger-object"`), so its
// lifelink, deathtouch and colour count, while the ability — Warstorm
// Surge's, and red — is what targets. Its power is read as the ability
// resolves, or as it last existed on the battlefield (rule 608.2h).
export default defineCard({
  name: "Warstorm Surge",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { powerOf: "trigger-object" }, target: 0, from: "trigger-object" },
      resolve: null,
      text: TEXT,
    },
  ],
});
