import { defineCard } from "../define.js";

export default defineCard({
  name: "Ajani, Caller of the Pride",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Ajani"],
  loyalty: 4,
  text:
    "[+1]: Put a +1/+1 counter on up to one target creature.\n" +
    "[−3]: Target creature gains flying and double strike until end of turn.\n" +
    "[−8]: Create X 2/2 white Cat creature tokens, where X is your life total.",
  activated: [
    {
      cost: { mana: null, tap: false },
      loyaltyCost: 1,
      targets: [{ kind: "optional", of: "creature" }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "+1: Put a +1/+1 counter on up to one target creature.",
    },
    {
      cost: { mana: null, tap: false },
      loyaltyCost: -3,
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "−3: Target creature gains flying and double strike until end of turn.",
    },
    {
      cost: { mana: null, tap: false },
      loyaltyCost: -8,
      targets: [],
      effect: { kind: "create-token", token: "Cat Token", count: { lifeTotal: "you" } },
      resolve: null,
      text: "−8: Create X 2/2 white Cat creature tokens, where X is your life total.",
    },
  ],
});
