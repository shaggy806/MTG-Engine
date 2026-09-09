import { defineCard } from "../define.js";

export default defineCard({
  name: "Lathliss, Dragon Queen",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever another nontoken Dragon you control enters, create a 5/5 red Dragon creature token with flying.\n" +
    "{2}{R}: Dragons you control get +1/+0 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { subtype: "Dragon", token: false },
      },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 1 },
      resolve: null,
      text: "Whenever another nontoken Dragon you control enters, create a 5/5 red Dragon creature token with flying.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { subtype: "Dragon", controlledBy: "you" },
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{R}: Dragons you control get +1/+0 until end of turn.",
    },
  ],
});
