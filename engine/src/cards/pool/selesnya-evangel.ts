import { defineCard } from "../define.js";

export default defineCard({
  name: "Selesnya Evangel",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 1,
  toughness: 2,
  text: "{1}, {T}, Tap an untapped creature you control: Create a 1/1 green Saproling creature token.",
  activated: [
    {
      cost: {
        mana: "{1}",
        tap: true,
        // "Tap **an** untapped creature you control" — the Evangel is already
        // tapping itself for `{T}`, so this is a different creature.
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text:
        "{1}, {T}, Tap an untapped creature you control: Create a 1/1 green " +
        "Saproling creature token.",
    },
  ],
});
