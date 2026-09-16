import { defineCard } from "../define.js";

export default defineCard({
  name: "Selesnya Guildmage",
  manaCost: "{G/W}{G/W}",
  colors: ["G", "W"],
  types: ["creature"],
  subtypes: ["Elf", "Wizard"],
  power: 2,
  toughness: 2,
  text:
    "{3}{G}: Create a 1/1 green Saproling creature token.\n" +
    "{3}{W}: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "{3}{G}: Create a 1/1 green Saproling creature token.",
    },
    {
      cost: { mana: "{3}{W}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{3}{W}: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
