import { defineCard } from "../define.js";

export default defineCard({
  name: "Wirewood Hivemaster",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: "Whenever another nontoken Elf enters, you may create a 1/1 green Insect creature token.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { token: false, subtype: "Elf" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 green Insect creature token?",
        effect: { kind: "create-token", token: "Insect Token", count: 1 },
      },
      resolve: null,
      text: "Whenever another nontoken Elf enters, you may create a 1/1 green Insect creature token.",
    },
  ],
});
