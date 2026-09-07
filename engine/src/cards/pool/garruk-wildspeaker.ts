import { defineCard } from "../define.js";

const youControlCreatures = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Garruk Wildspeaker",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Garruk"],
  loyalty: 3,
  text:
    "[+1]: Untap two target lands.\n" +
    "[-1]: Create a 3/3 green Beast creature token.\n" +
    "[-4]: Creatures you control get +3/+3 and gain trample until end of turn.",
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["land", "land"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: 0 },
          { kind: "untap", target: 1 },
        ],
      },
      resolve: null,
      text: "[+1]: Untap two target lands.",
    },
    {
      loyaltyCost: -1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
      resolve: null,
      text: "[-1]: Create a 3/3 green Beast creature token.",
    },
    {
      loyaltyCost: -4,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: youControlCreatures,
            power: 3,
            toughness: 3,
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: youControlCreatures,
            keyword: "trample",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "[-4]: Creatures you control get +3/+3 and gain trample until end of turn.",
    },
  ],
});
