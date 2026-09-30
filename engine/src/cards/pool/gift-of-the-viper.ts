import { defineCard } from "../define.js";

// Reach and deathtouch counters are keyword counters (rule 122.1b).
export default defineCard({
  name: "Gift of the Viper",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Put a +1/+1 counter, a reach counter, and a deathtouch counter on target creature. Untap it.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "add-counter", target: 0, counter: "reach", amount: 1 },
      { kind: "add-counter", target: 0, counter: "deathtouch", amount: 1 },
      { kind: "untap", target: 0 },
    ],
  },
});
