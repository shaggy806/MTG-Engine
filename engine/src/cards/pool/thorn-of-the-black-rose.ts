import { defineCard } from "../define.js";

/** ROADMAP Phase 10 — the Monarch (rule 720). */
export default defineCard({
  name: "Thorn of the Black Rose",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 1,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhen Thorn of the Black Rose enters the battlefield, you become the monarch.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When Thorn of the Black Rose enters the battlefield, you become the monarch.",
    },
  ],
});
