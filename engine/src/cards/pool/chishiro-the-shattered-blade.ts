import { defineCard } from "../define.js";

export default defineCard({
  name: "Chishiro, the Shattered Blade",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Snake", "Samurai"],
  power: 4,
  toughness: 4,
  text:
    "Whenever an Aura or Equipment you control enters, create a 2/2 red Spirit creature token with menace.\n" +
    "At the beginning of your end step, put a +1/+1 counter on each modified creature you control. " +
    "(Equipment, Auras you control, and counters are modifications.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtypes: ["Aura", "Equipment"] },
      },
      targets: [],
      effect: { kind: "create-token", token: "2/2 Red Spirit Token", count: 1 },
      resolve: null,
      text: "Whenever an Aura or Equipment you control enters, create a 2/2 red Spirit creature token with menace.",
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you", modified: true },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "At the beginning of your end step, put a +1/+1 counter on each modified creature you control.",
    },
  ],
});
