import { defineCard } from "../define.js";

export default defineCard({
  name: "Overseer of the Damned",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "When Overseer of the Damned enters, you may destroy target creature.\n" +
    "Whenever a nontoken creature an opponent controls dies, create a tapped " +
    "2/2 black Zombie creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "creature" }],
      effect: {
        kind: "may",
        prompt: "Destroy the targeted creature?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "When Overseer of the Damned enters, you may destroy target creature.",
    },
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { type: "creature", token: false, controlledBy: "opponent" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1, tapped: true },
      resolve: null,
      text:
        "Whenever a nontoken creature an opponent controls dies, create a tapped " +
        "2/2 black Zombie creature token.",
    },
  ],
});
