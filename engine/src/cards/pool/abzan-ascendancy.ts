import { defineCard } from "../define.js";

export default defineCard({
  name: "Abzan Ascendancy",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  types: ["enchantment"],
  text: "When this enchantment enters, put a +1/+1 counter on each creature you control.\nWhenever a nontoken creature you control dies, create a 1/1 white Spirit creature token with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "When this enchantment enters, put a +1/+1 counter on each creature you control.",
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { token: false, type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: "Whenever a nontoken creature you control dies, create a 1/1 white Spirit creature token with flying.",
    },
  ],
});
