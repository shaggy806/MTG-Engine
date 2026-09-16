import { defineCard } from "../define.js";

export default defineCard({
  name: "Felidar Retreat",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "Landfall — Whenever a land you control enters, choose one —\n" +
    "• Create a 2/2 white Cat Beast creature token.\n" +
    "• Put a +1/+1 counter on each creature you control. Those creatures gain " +
    "vigilance until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "land", controlledBy: "you" },
      },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Create a 2/2 white Cat Beast creature token.",
            effect: { kind: "create-token", token: "Cat Beast Token", count: 1 },
          },
          {
            text:
              "Put a +1/+1 counter on each creature you control. Those creatures " +
              "gain vigilance until end of turn.",
            effect: {
              kind: "sequence",
              effects: [
                {
                  kind: "add-counter-all",
                  filter: { type: "creature", controlledBy: "you" },
                  counter: "+1/+1",
                  amount: 1,
                },
                {
                  kind: "grant-keyword-all",
                  filter: { type: "creature", controlledBy: "you" },
                  keyword: "vigilance",
                  duration: "end-of-turn",
                },
              ],
            },
          },
        ],
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, choose one — Create a 2/2 " +
        "white Cat Beast creature token; or put a +1/+1 counter on each creature " +
        "you control, and those creatures gain vigilance until end of turn.",
    },
  ],
});
