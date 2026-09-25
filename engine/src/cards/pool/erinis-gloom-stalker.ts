import { defineCard } from "../define.js";

export default defineCard({
  name: "Erinis, Gloom Stalker",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Ranger"],
  power: 3,
  toughness: 3,
  keywords: ["deathtouch"],
  pairing: { kind: "choose-a-background" },
  text: "Deathtouch\nWhenever Erinis attacks, return target land card from your graveyard to the battlefield.\nChoose a Background (You can have a Background as a second commander.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "Whenever Erinis attacks, return target land card from your graveyard to the battlefield.",
    },
  ],
});
