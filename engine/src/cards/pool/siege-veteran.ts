import { defineCard } from "../define.js";

export default defineCard({
  name: "Siege Veteran",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "At the beginning of combat on your turn, put a +1/+1 counter on target creature you control.\nWhenever another nontoken Soldier you control dies, create a 1/1 colorless Soldier artifact creature token.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "At the beginning of combat on your turn, put a +1/+1 counter on target creature you control.",
    },
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { token: false, subtype: "Soldier" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Artifact Token", count: 1 },
      resolve: null,
      text: "Whenever another nontoken Soldier you control dies, create a 1/1 colorless Soldier artifact creature token.",
    },
  ],
});
