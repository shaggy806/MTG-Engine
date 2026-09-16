import { defineCard } from "../define.js";

export default defineCard({
  name: "Hornet Queen",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "deathtouch"],
  text:
    "Flying, deathtouch\n" +
    "When Hornet Queen enters, create four 1/1 green Insect creature tokens with " +
    "flying and deathtouch.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Insect Token (Flying, Deathtouch)",
        count: 4,
      },
      resolve: null,
      text:
        "When Hornet Queen enters, create four 1/1 green Insect creature tokens with " +
        "flying and deathtouch.",
    },
  ],
});
