// Random-vs-random games: both seats pick uniformly from legalActions().
// Doubles as an engine fuzzer — if legalActions ever offers something dispatch
// refuses, this crashes.
//
//   npm run play:random -w engine
//   npm run play:random -w engine -- --games 50
//   npm run play:random -w engine -- --log        # print the last game's log
//   npm run play:random -w engine -- --players 3  # or 4 — exercises multi-opponent combat
//   npm run play:random -w engine -- --seed 19    # replay exactly one seed
//   npm run play:random -w engine -- --timeout 60 # per-game limit, seconds (default 30)
//
// Each game runs in a worker thread with a wall-clock limit. A game that
// never finishes is killed and reported as a failure naming its seed, instead
// of stalling the whole run — a runaway loop inside one `tick()` never yields,
// so nothing short of terminating the thread can stop it. Any failure (a
// timeout, or a thrown error) makes the process exit non-zero.

import { Worker } from "node:worker_threads";

import { Game, RandomController, asPlayerId, createRng } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const games = Number(flag("games", "10"));
const showLog = args.includes("--log");
const numPlayers = Number(flag("players", "2"));
// Long runs print nothing until the very end, so a game that never terminates
// looks identical to one that's merely slow. `--progress` announces each seed
// on stderr *before* playing it — the last line printed names the culprit.
const showProgress = args.includes("--progress");
const onlySeed = flag("seed", null);
const timeoutMs = Number(flag("timeout", "30")) * 1000;

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

/** `[["Forest", 17], ["Grizzly Bears", 4], ...]` -> a flat 40-card list. */
const deck = (entries) =>
  entries.flatMap(([name, count]) => Array(count).fill(name));

// Both decks get a mana base that can actually cast their own spells —
// otherwise one side just sits there and the fuzz only exercises one player.
const deckA = deck([
  // Mana abilities with a live amount (power, cards drawn this turn).
  ["Vivi Ornitier", 1],
  ["Marwyn, the Nurturer", 1],
  ["Kydele, Chosen of Kruphix", 1],
  // A counter that puts the spell into its owner's hand instead (Remand).
  ["Remand", 1],
  // EDH-backlog bulk pass 5: Snarl reveal-lands and Karoo bounce lands (new:
  // the `land-you-control` target spec).
  ["Vineglimmer Snarl", 1],
  ["Frostboil Snarl", 1],
  ["Simic Growth Chamber", 1],
  ["Izzet Boilerworks", 1],
  ["Gruul Turf", 1],
  // EDH-backlog bulk pass 4: Triomes, and the cards two new primitives
  // unblocked (a `graveyard` tutor destination; the artifact-or-creature and
  // nonartifact-creature target specs).
  ["Ketria Triome", 1],
  ["Zagoth Triome", 1],
  ["Raugrin Triome", 1],
  ["Buried Alive", 1],
  ["Putrefy", 1],
  // EDH-backlog bulk pass 3: tri-lands, Odyssey filter lands, and simple
  // artifacts/creatures.
  ["Arcane Sanctum", 1],
  ["Seaside Citadel", 1],
  ["Darkwater Catacombs", 1],
  ["Sungrass Prairie", 1],
  ["Gilded Lotus", 1],
  ["Evolution Sage", 1],
  ["Snakeskin Veil", 1],
  // EDH-backlog bulk pass 2: Battlebond lands (new: the `opponent-count`
  // static condition). The fuzzer runs 2-4 players, so both sides of the
  // "two or more opponents" check get exercised.
  ["Morphic Pool", 1],
  ["Sea of Clouds", 1],
  ["Spire Garden", 1],
  ["Training Center", 1],
  ["Rejuvenating Springs", 1],
  // EDH-backlog bulk pass 1: the guild Signets, and the simple shapes that
  // needed no new vocabulary.
  ["Izzet Signet", 1],
  ["Gruul Signet", 1],
  ["Simic Signet", 1],
  ["Exploration", 1],
  ["Seething Song", 1],
  ["Worldly Tutor", 1],
  ["Impact Tremors", 1],
  // EDH-backlog: derived mana colours, hand-to-library-top, punisher.
  ["Exotic Orchard", 1],
  ["Fellwar Stone", 1],
  ["Reliquary Tower", 1],
  // EDH-backlog: put-a-card-from-hand-onto-the-battlefield.
  ["Sneak Attack", 1],
  ["Growth Spiral", 1],
  ["Eureka Moment", 1],
  ["Ghalta, Stampede Tyrant", 1],
  ["Terrain Generator", 1],
  ["Kodama's Reach", 1],
  ["Aura Mutation", 1],
  ["Cultivate", 1],
  ["Scavenging Ooze", 1],
  ["Primal Might", 1],
  ["Hunter's Prowess", 1],
  ["Loyal Guardian", 1],
  ["Thunderfoot Baloth", 1],
  ["Rishkar, Peema Renegade", 1],
  ["Hunter's Insight", 1],
  ["Return to Nature", 1],
  ["Harvest Season", 1],
  ["Heraldic Banner", 1],
  ["Sephara, Sky's Blade", 1],
  ["Frontier Siege", 1],
  ["Nissa's Expedition", 1],
  ["Burnished Hart", 1],
  ["Fortified Village", 1],
  ["Game Trail", 1],
  ["Forest", 9],
  ["Tranquil Thicket", 2],
  ["Mishra's Factory", 2],
  ["Temple Garden", 1],
  ["Windswept Heath", 1],
  ["Sunpetal Grove", 1],
  ["Canopy Vista", 1],
  ["Brushland", 1],
  ["Talisman of Unity", 1],
  ["Wayfarer's Bauble", 1],
  ["Ashnod's Altar", 1],
  ["Elvish Mystic", 2],
  ["Three Visits", 1],
  ["Fyndhorn Elves", 1],
  ["Harmonize", 1],
  ["Skyshroud Claim", 1],
  ["Reclamation Sage", 1],
  ["Ornithopter of Paradise", 1],
  ["Thran Dynamo", 1],
  ["Emerald Medallion", 1],
  ["Karn's Bastion", 1],
  // Mana provenance: restricted spend, a spend rider, and the "can't be
  // countered" clause that rides on Cavern's mana.
  ["Cavern of Souls", 1],
  ["Unclaimed Territory", 1],
  ["Secluded Courtyard", 1],
  ["Ancient Ziggurat", 1],
  ["Path of Ancestry", 1],
  ["Tree of Tales", 1],
  ["Temple of Plenty", 1],
  ["Overgrown Farmland", 1],
  ["Savannah", 1],
  ["Eternal Witness", 1],
  ["Solemn Simulacrum", 1],
  ["Walking Ballista", 2],
  ["Llanowar Elves", 4],
  ["Grizzly Bears", 4],
  ["Elvish Visionary", 4],
  ["Rumbling Baloth", 2],
  ["Craw Wurm", 2],
  ["Giant Growth", 3],
  ["Ureni of the Unwritten", 1],
  ["Regrowth", 1],
  ["Oracle of Mul Daya", 1],
  ["Colossal Dreadmaw", 1],
  ["Naturalize", 2],
  ["Beast Within", 1],
  ["Prey Upon", 2],
  ["Rabid Bite", 1],
  ["Gladecover Scout", 2],
  ["Darksteel Myr", 1],
  ["Ambush Viper", 2],
  ["Contentious Plan", 1],
  ["Fog", 2],
  ["Doubling Season", 1],
  ["Rampant Growth", 2],
  ["Splendid Reclamation", 1],
  ["Harrow", 1],
  ["Crop Rotation", 1],
  ["Bojuka Bog", 1],
  ["Aftermath Analyst", 1],
  ["World Shaper", 1],
  ["Ramunap Excavator", 1],
  ["Tireless Provisioner", 1],
  ["Lotus Cobra", 1],
  ["Azusa, Lost but Seeking", 1],
  ["Icetill Explorer", 1],
  ["Sabotender", 1],
  ["Tannuk, Memorial Ensign", 1],
  ["Encroaching Dragonstorm", 1],
  ["Temur Battlecrier", 1],
  ["Mole Man, Moloid Master", 1],
  ["Rydia, Summoner of Mist", 1],
  ["Will of the Sultai", 1],
  ["Craterhoof Behemoth", 1],
  ["Finale of Devastation", 1],
  ["Scourge of Valkas", 1],
  ["Old Gnawbone", 1],
  ["Utvara Hellkite", 1],
  ["Atarka, World Render", 1],
  ["Miirym, Sentinel Wyrm", 1],
  ["Scute Swarm", 1],
  ["Garruk's Uprising", 1],
  ["Defense of the Heart", 1],
  ["Rampaging Baloths", 1],
  ["Juggernaut", 1],
  ["Combat Thresher", 1],
  ["Foundry Inspector", 1],
  ["Urza's Incubator", 1],
  ["Ignoble Hierarch", 1],
  ["Starfield Vocalist", 1],
  ["Lightning Greaves", 1],
  ["Summon: Titan", 1],
  ["Sol Ring", 1],
  ["Command Tower", 1],
  ["Prosperous Innkeeper", 1],
  ["Wilt-Leaf Cavaliers", 1],
  ["Kazandu Mammoth", 2],
  ["Harvesttide Infiltrator", 2],
  ["Longtusk Cub", 2],
  ["Carnage Tyrant", 1],
  ["Kird Ape", 2],
  ["Werebear", 2],
  ["Cinder Elemental", 2],
  ["Lure", 1],
  ["Garruk Wildspeaker", 1],
  ["Mending Hands", 2],
  ["Emmara, Soul of the Accord", 1],
  ["Kiora, Behemoth Beckoner", 1],
  ["Cryptolith Rite", 1],
  ["Chromatic Lantern", 1],
  ["Evolving Wilds", 2],
  ["Temple of Abandon", 1],
  ["Frontier Bivouac", 1],
  ["Rootbound Crag", 1],
  ["Hinterland Harbor", 1],
  ["Farseek", 1],
  ["Karplusan Forest", 1],
  ["Yavimaya Coast", 1],
  ["Stomping Ground", 1],
  ["Sheltered Thicket", 1],
  ["Cinder Glade", 1],
  ["Amulet of Vigor", 1],
  ["Sakura-Tribe Elder", 1],
  ["Bountiful Landscape", 1],
  ["Ganax, Astral Hunter", 1],
  ["Dragon Tempest", 1],
  ["Lotus Field", 1],
  ["Blasphemous Act", 1],
  ["Genesis Ultimatum", 1],
  ["Fanatic of Rhonas", 1],
  ["Orcish Lumberjack", 1],
  ["Boseiju, Who Endures", 1],
  ["Otawara, Soaring City", 1],
  ["Cyclonic Rift", 1],
  ["Fierce Guardianship", 1],
  ["Kalonian Hydra", 1],
  ["Bristly Bill, Spine Sower", 1],
  ["Unnatural Growth", 1],
]);
// Kept deliberately lean (~50 cards) so the RandomController actually draws
// and plays its threats — a bloated deck just stalls out and the fuzz only
// exercises one side. One or two copies of each mechanic is enough coverage.
const deckB = deck([
  // EDH-backlog bulk pass 5 (the rest — see deckA).
  ["Necroblossom Snarl", 1],
  ["Shineshadow Snarl", 1],
  ["Rakdos Carnarium", 1],
  ["Golgari Rot Farm", 1],
  ["Orzhov Basilica", 1],
  // EDH-backlog bulk pass 4 (the rest — see deckA).
  ["Savai Triome", 1],
  ["Indatha Triome", 1],
  ["Raffine's Tower", 1],
  ["Entomb", 1],
  ["Go for the Throat", 1],
  ["Pitiless Plunderer", 1],
  // EDH-backlog bulk pass 3 (the rest — see deckA).
  ["Crumbling Necropolis", 1],
  ["Nomad Outpost", 1],
  ["Skycloud Expanse", 1],
  ["Shadowblood Ridge", 1],
  ["Baleful Strix", 1],
  ["Etherium Sculptor", 1],
  ["Decanter of Endless Water", 1],
  ["Nature's Claim", 1],
  // EDH-backlog bulk pass 2 (the rest of the Battlebond cycle).
  ["Luxury Suite", 1],
  ["Bountiful Promenade", 1],
  ["Vault of Champions", 1],
  ["Undergrowth Stadium", 1],
  ["Spectator Seating", 1],
  // EDH-backlog bulk pass 1 (the rest — see deckA).
  ["Orzhov Signet", 1],
  ["Golgari Signet", 1],
  ["Boros Signet", 1],
  ["Selesnya Signet", 1],
  ["Withering Torment", 1],
  ["Dovin's Veto", 1],
  ["Whispersilk Cloak", 1],
  // EDH-backlog: additional costs, delirium/threshold/morbid, X-paid-in-life.
  ["Reanimate", 1],
  ["Toxic Deluge", 1],
  ["Cabal Ritual", 1],
  ["Tragic Slip", 1],
  ["Dragon's Rage Channeler", 1],
  ["Thrill of Possibility", 1],
  // A choice of additional costs: two variants per cast, so the fuzzer
  // checks that whichever branch `legalActions` offered is one `dispatch`
  // accepts.
  ["Bitter Triumph", 1],
  // Counters that persist across zone changes: dies with them, comes back
  // with them off Reanimate beside it; a bounce strips them.
  ["Skullbriar, the Walking Grave", 1],
  // The first commanders authored off top-commanders.txt. Krenko is here
  // deliberately: his token count doubles every activation, which is the
  // self-replicating shape that motivated token stacking in the first
  // place, so the fuzzer should be the thing that finds it if it blows up.
  ["Krenko, Mob Boss", 1],
  ["Rograkh, Son of Rohgahh", 1],
  ["Kenrith, the Returned King", 1],
  // `draws` triggers: every card drawn is a trigger, which is the other shape
  // (after Krenko's doubling) that can snowball.
  ["Nekusar, the Mindrazer", 1],
  ["Niv-Mizzet, Parun", 1],
  ["Sheoldred, the Apocalypse", 1],
  ["Queza, Augur of Agonies", 1],
  ["Temmet, Naktamun's Will", 1],
  ["Arabella, Abandoned Doll", 1],
  ["Urtet, Remnant of Memnarch", 1],
  ["Voja, Jaws of the Conclave", 1],
  ["Aesi, Tyrant of Gyre Strait", 1],
  ["Queen Marchesa", 1],
  ["Kraum, Ludevic's Opus", 1],
  ["Flubs, the Fool", 1],
  ["Gishath, Sun's Avatar", 1],
  ["Animar, Soul of Elements", 1],
  ["Karador, Ghost Chieftain", 1],
  ["Isshin, Two Heavens as One", 1],
  ["Elesh Norn, Mother of Machines", 1],
  ["Felix Five-Boots", 1],
  ["Rin and Seri, Inseparable", 1],
  ["Marrow-Gnawer", 1],
  ["Sythis, Harvest's Hand", 1],
  ["Ishai, Ojutai Dragonspeaker", 1],
  ["Shroofus Sproutsire", 1],
  // Top-500 commanders that needed no new engine feature.
  ["Yoshimaru, Ever Faithful", 1],
  ["Chulane, Teller of Tales", 1],
  ["Tatyova, Benthic Druid", 1],
  ["Elsha, Threefold Master", 1],
  ["Adrix and Nev, Twincasters", 1],
  ["Squall, SeeD Mercenary", 1],
  ["The Unbeatable Squirrel Girl", 1],
  ["Ardbert, Warrior of Darkness", 1],
  ["Mabel, Heir to Cragflame", 1],
  ["Talrand, Sky Summoner", 1],
  ["Ognis, the Dragon's Lash", 1],
  ["Ruric Thar, the Unbowed", 1],
  ["Ravos, Soultender", 1],
  ["Thorin, King of Durin's Folk", 1],
  ["Demand Answers", 1],
  ["Cathartic Reunion", 1],
  ["Seize the Spoils", 1],
  ["Big Score", 1],
  ["Culling the Weak", 1],
  ["Corrupted Conviction", 1],
  // EDH-backlog: delayed triggered abilities + tutor-to-top.
  ["Assassin's Trophy", 1],
  ["Unearth", 1],
  ["Whip of Erebos", 1],
  ["Vampiric Tutor", 1],
  ["Imperial Seal", 1],
  ["Mortuary Mire", 1],
  ["Kiki-Jiki, Mirror Breaker", 1],
  ["Stormfist Crusader", 1],
  ["Feed the Swarm", 1],
  ["Foreboding Ruins", 1],
  ["Runehorn Hellkite", 1],
  ["Steel Hellkite", 1],
  ["Akoum Hellkite", 1],
  ["Withered Wretch", 1],
  ["Hate Mirage", 1],
  ["Thunderbreak Regent", 1],
  ["Loyal Subordinate", 1],
  ["Lazotep Reaver", 1],
  ["Dragonkin Berserker", 1],
  ["Dictate of the Twin Gods", 1],
  ["Spit Flame", 1],
  ["Demanding Dragon", 1],
  ["Dream Pillager", 1],
  ["Geode Rager", 1],
  ["Rakshasa Debaser", 1],
  ["Archfiend of Depravity", 1],
  ["Gravespawn Sovereign", 1],
  ["Flameblast Dragon", 1],
  ["Aetherize", 1],
  ["Rally of Wings", 1],
  ["Cleansing Nova", 1],
  ["Crush Contraband", 1],
  ["Winged Words", 1],
  ["Warden of Evos Isle", 1],
  ["Windreader Sphinx", 1],
  ["Steel-Plume Marshal", 1],
  ["Aven Gagglemaster", 1],
  ["Archon of Redemption", 1],
  ["Emeria Angel", 1],
  ["Sporemound", 1],
  ["Valor in Akros", 1],
  ["Dauntless Escort", 1],
  ["Selesnya Guildmage", 1],
  ["Camaraderie", 1],
  ["Citanul Hierophants", 1],
  ["Nullmage Shepherd", 1],
  ["Gisa and Geralf", 1],
  // Graveyard cast permissions: Muldrotha's per-type allowances (a land
  // played, a multi-typed card spending one type) and the one-shot "you may
  // cast that card this turn" on a card (Silas Renn, Emry).
  ["Muldrotha, the Gravetide", 1],
  ["Silas Renn, Seeker Adept", 1],
  ["Emry, Lurker of the Loch", 1],
  ["White Sun's Zenith", 1],
  ["Commander's Insignia", 1],
  ["Idol of Oblivion", 1],
  ["Laboratory Drudge", 1],
  ["Vow of Duty", 1],
  ["Crippling Fear", 1],
  ["Distant Melody", 1],
  ["Thought Vessel", 1],
  ["Gravitational Shift", 1],
  ["Condemn", 1],
  ["Hanged Executioner", 1],
  ["Kangee, Sky Warden", 1],
  ["Skycat Sovereign", 1],
  ["Ever-Watching Threshold", 1],
  ["Path to Exile", 1],
  ["Gray Merchant of Asphodel", 1],
  ["Liliana's Standard Bearer", 1],
  ["Slate of Ancestry", 1],
  ["Great Oak Guardian", 1],
  ["Voice of Many", 1],
  ["Sangromancer", 1],
  ["Brash Taunter", 1],
  ["Hornet Nest", 1],
  ["Overwhelming Instinct", 1],
  ["Tide Skimmer", 1],
  ["Banishing Light", 1],
  ["Conclave Tribunal", 1],
  ["Army of the Damned", 1],
  ["Necrotic Hex", 1],
  ["Overseer of the Damned", 1],
  ["Josu Vess, Lich Knight", 1],
  ["Zombie Apocalypse", 1],
  ["Cruel Revival", 1],
  ["Devouring Light", 1],
  ["Scatter the Seeds", 1],
  ["March of the Multitudes", 1],
  ["Chord of Calling", 1],
  ["Farhaven Elf", 1],
  ["Pilgrim's Eye", 1],
  ["Sphinx of Enlightenment", 1],
  ["Time Wipe", 1],
  ["Vitu-Ghazi, the City-Tree", 1],
  ["Selesnya Evangel", 1],
  ["Leafkin Druid", 1],
  ["Faerie Formation", 1],
  ["Soul Snare", 1],
  ["Isperia, Supreme Judge", 1],
  ["Sharding Sphinx", 1],
  ["Staggering Insight", 1],
  ["Karametra's Favor", 1],
  ["Presence of Gond", 1],
  ["Maja, Bretagard Protector", 1],
  ["Victimize", 1],
  ["Sylvan Reclamation", 1],
  ["Felidar Retreat", 1],
  ["Jaspera Sentinel", 1],
  ["Holdout Settlement", 1],
  ["Azorius Signet", 1],
  ["Dimir Signet", 1],
  ["Rakdos Signet", 1],
  // First Flight / Token Triumph / Grave Danger precons.
  ["Blossoming Sands", 1],
  ["Coastal Tower", 1],
  ["Dismal Backwater", 1],
  ["Elfhame Palace", 1],
  ["Graypelt Refuge", 1],
  ["Jwar Isle Refuge", 1],
  ["Meandering River", 1],
  ["Salt Marsh", 1],
  ["Sejiri Refuge", 1],
  ["Submerged Boneyard", 1],
  ["Tranquil Cove", 1],
  ["Tranquil Expanse", 1],
  ["Choked Estuary", 1],
  ["Collective Blessing", 1],
  ["Dictate of Heliod", 1],
  ["Favorable Winds", 1],
  ["Empyrean Eagle", 1],
  ["Thunderclap Wyvern", 1],
  ["True Conviction", 1],
  ["Liliana's Mastery", 1],
  ["Lord of the Accursed", 1],
  ["Diregraf Captain", 1],
  ["Vengeful Dead", 1],
  ["Undead Augur", 1],
  ["Champion of the Perished", 1],
  ["Murder", 1],
  ["Swords to Plowshares", 1],
  ["Collective Unconscious", 1],
  ["Sphinx's Revelation", 1],
  ["Overrun", 1],
  ["Citywide Bust", 1],
  ["Skyscanner", 1],
  ["Cloudblazer", 1],
  ["Mire Triton", 1],
  ["Hedron Archive", 1],
  ["Sky Diamond", 1],
  ["Unstable Obelisk", 1],
  ["Absorb", 1],
  ["Undermine", 1],
  ["Sinister Sabotage", 1],
  ["Pilfered Plans", 1],
  ["Jade Mage", 1],
  ["Verdant Force", 1],
  ["Avacyn's Pilgrim", 1],
  ["Vampiric Rites", 1],
  ["Spark Reaper", 1],
  ["Remorseful Cleric", 1],
  ["Open the Graves", 1],
  ["Midnight Reaper", 1],
  ["Storm Herd", 1],
  ["Hornet Queen", 1],
  ["Inspired Sphinx", 1],
  // Chaos Incarnate precon.
  ["Akoum Refuge", 1],
  ["Bloodfell Caves", 1],
  ["Cinder Barrens", 1],
  ["Urborg Volcano", 1],
  ["Stensia Bloodhall", 1],
  ["Worn Powerstone", 1],
  ["Ambition's Cost", 1],
  ["Read the Bones", 1],
  ["Sign in Blood", 1],
  ["Breath of Malfegor", 1],
  ["Magmatic Force", 1],
  ["Kaervek the Merciless", 1],
  ["Guttersnipe", 1],
  ["Thermo-Alchemist", 1],
  ["Mana Geyser", 1],
  ["Titan Hunter", 1],
  ["Unlicensed Disintegration", 1],
  ["Kardur, Doomscourge", 1],
  // Draconic Destruction precon (phase F).
  ["Crucible of Fire", 1],
  ["Furnace Whelp", 1],
  ["Dragonlord's Servant", 1],
  ["Elemental Bond", 1],
  ["Fires of Yavimaya", 1],
  ["Blossoming Defense", 1],
  ["Provoke the Trolls", 1],
  ["Rapacious Dragon", 1],
  ["Draconic Disciple", 1],
  ["Drumhunter", 1],
  ["Chain Reaction", 1],
  ["Sweltering Suns", 1],
  ["Harbinger of the Hunt", 1],
  ["Shamanic Revelation", 1],
  ["Dragonmaster Outcast", 1],
  ["Verix Bladewing", 1],
  ["Thundermaw Hellkite", 1],
  ["Clan Defiance", 1],
  ["Drakuseth, Maw of Flames", 1],
  ["Mordant Dragon", 1],
  ["Atarka Monument", 1],
  ["Commander's Sphere", 1],
  ["Dragon's Hoard", 1],
  ["Shivan Oasis", 1],
  ["Timber Gorge", 1],
  ["Kazandu Refuge", 1],
  ["Rugged Highlands", 1],
  ["Tectonic Giant", 1],
  ["Theater of Horrors", 1],
  ["Kazuul, Tyrant of the Cliffs", 1],
  ["Nihil Spellbomb", 1],
  ["Unleash Fury", 1],
  ["Vizier of the Scorpion", 1],
  ["Tyrant's Familiar", 1],
  ["Ajani, Caller of the Pride", 1],
  ["Cemetery Reaper", 1],
  ["Hoard-Smelter Dragon", 1],
  ["Dragon Mage", 1],
  ["Bloodgift Demon", 1],
  ["Mountain", 4],
  ["Swamp", 4],
  ["Island", 3],
  ["Blinkmoth Nexus", 2],
  ["Forest", 2],
  ["City of Brass", 1],
  ["Mana Confluence", 1],
  ["Ancient Tomb", 1],
  ["Dragonskull Summit", 1],
  ["Smoldering Marsh", 1],
  ["Sulfurous Springs", 1],
  ["Scalding Tarn", 1],
  ["Talisman of Indulgence", 1],
  ["Mind Stone", 1],
  ["Lotus Petal", 1],
  ["Swiftfoot Boots", 1],
  ["Dark Ritual", 1],
  ["Terminate", 1],
  ["Stroke of Midnight", 1],
  ["Anguished Unmaking", 1],
  ["Basilisk Collar", 1],
  ["Jet Medallion", 1],
  ["Ruby Medallion", 1],
  ["Temple of Epiphany", 1],
  ["Haunted Ridge", 1],
  ["Badlands", 1],
  ["Darksteel Citadel", 1],
  ["Great Furnace", 1],
  ["Phyrexian Tower", 1],
  ["Temple of the False God", 1],
  ["Abrade", 1],
  ["Deadly Dispute", 1],
  ["Generous Gift", 1],
  ["Tear Asunder", 1],
  ["Raging Goblin", 2],
  ["White Knight", 2],
  ["Boggart Brute", 2],
  ["Typhoid Rats", 2],
  ["Monastery Swiftspear", 2],
  ["Vampire Nighthawk", 2],
  ["Thieving Magpie", 2],
  ["Hypnotic Specter", 1],
  ["Mind Control", 2],
  ["Mortivore", 1],
  ["Lord of Extinction", 1],
  ["Clone", 2],
  ["Turn to Frog", 2],
  ["Doom Blade", 2],
  ["Artificial Evolution", 1],
  ["Wurmcoil Engine", 1],
  ["Lightning Bolt", 2],
  ["Fireball", 1],
  ["Volt Charge", 1],
  ["Act of Treason", 2],
  ["Sliver Overlord", 1],
  ["Man-o'-War", 2],
  ["Unsummon", 1],
  ["Fume Spitter", 1],
  ["Iridescent Vinelasher", 2],
  ["Terror of the Peaks", 1],
  ["Bloodthrone Vampire", 1],
  ["Mind Rot", 1],
  ["Blightning", 1],
  ["Faithless Looting", 2],
  ["Snapcaster Mage", 1],
  ["Rift Bolt", 2],
  ["Behold the Multiverse", 1],
  ["Underworld Rage-Hound", 2],
  ["Counterspell", 1],
  ["An Offer You Can't Refuse", 1],
  ["Rapid Hybridization", 2],
  ["Saw in Half", 1],
  ["Negate", 1],
  ["Essence Scatter", 1],
  ["Bonesplitter", 1],
  ["Holy Strength", 1],
  ["Essence Flux", 1],
  ["Disenchant", 1],
  ["Angelic Edict", 1],
  ["Tome Scour", 1],
  ["Raise the Alarm", 1],
  ["History of Benalia", 1],
  ["Plains", 5],
  ["Rest in Peace", 1],
  ["Anafenza, the Foremost", 1],
  ["Notion Thief", 1],
  ["Austere Command", 2],
  ["Pyroclasm", 1],
  ["Gaze of Granite", 1],
  ["Magmaquake", 1],
  ["Kessig Wolf Run", 1],
  ["Wrath of God", 1],
  ["Diabolic Edict", 2],
  ["Fleshbag Marauder", 2],
  ["Korvold, Fae-Cursed King", 1],
  ["Zuran Orb", 1],
  ["Sylvan Safekeeper", 1],
  ["Demonic Tutor", 1],
  ["Preordain", 2],
  ["Soul Warden", 1],
  ["Ajani's Pridemate", 1],
  ["Grave Pact", 1],
  ["Zulaport Cutthroat", 1],
  ["Pacifism", 2],
  ["Greed", 1],
  ["Combat Thresher", 1],
  ["Foundry Inspector", 1],
  ["Thalia, Guardian of Thraben", 1],
  ["Sol Ring", 1],
  ["Arcane Signet", 1],
  ["Gut Shot", 2],
  ["Flame Javelin", 1],
  ["Chandra, Acolyte of Flame", 1],
  ["Ob Nixilis, the Fallen", 1],
  ["Evolving Wilds", 2],
  ["Time Warp", 1],
  ["Aggravated Assault", 1],
  ["Rogue's Passage", 1],
  ["Grapeshot", 1],
  ["Bloodbraid Elf", 1],
  ["Twincast", 1],
  ["Bloodline Keeper", 2],
  ["Thorn of the Black Rose", 1],
  ["Elspeth, Sun's Champion", 1],
  ["Baithook Angler", 2],
  ["Beanstalk Giant", 2],
  ["Lumra, Bellow of the Woods", 1],
  ["Simic Charm", 2],
  ["Kolaghan's Command", 1],
  ["Ardent Recruit", 2],
  ["Rakdos Charm", 1],
  ["Takenuma, Abandoned Mire", 1],
  ["Eiganjo, Seat of the Empire", 1],
  ["Vandalblast", 1],
  ["Damn", 1],
  ["Deadly Rollick", 1],
  ["Flawless Maneuver", 1],
  ["Hour of Reckoning", 1],
]);

// A lean Dimir deck for Carol — carries the `Ayara, First of Locthwain`
// commander (a `leaves-battlefield` + `dies` trigger) so the fuzzer exercises
// the 903.9a "ask before the move" replacement path.
const deckC = deck([
  // EDH-backlog: derived mana colours, hand-to-library-top, punisher.
  ["Brainstorm", 1],
  ["Swan Song", 1],
  ["Rhystic Study", 1],
  // EDH-backlog: delayed triggered abilities + tutor-to-top.
  ["Sun Titan", 1],
  ["Frantic Search", 1],
  ["Arcane Denial", 1],
  ["Mystical Tutor", 1],
  ["Enlightened Tutor", 1],
  ["Academy Ruins", 1],
  ["Hall of Heliod's Generosity", 1],
  ["Eternal Skylord", 1],
  ["Deep Analysis", 1],
  ["Vela the Night-Clad", 1],
  ["Migratory Route", 1],
  ["Kangee's Lieutenant", 1],
  ["Dawn of Hope", 1],
  ["Indulgent Tormentor", 1],
  ["Mentor of the Meek", 1],
  ["Liliana's Devotee", 1],
  ["Rootborn Defenses", 1],
  ["Geralf's Mindcrusher", 1],
  ["Lotleth Giant", 1],
  ["Gleaming Overseer", 1],
  ["Lazotep Plating", 1],
  ["Enter the God-Eternals", 1],
  ["Island", 7],
  ["Swamp", 7],
  ["Watery Grave", 1],
  ["Drowned Catacomb", 1],
  ["Underground River", 1],
  ["Polluted Delta", 1],
  ["Sunken Hollow", 1],
  ["Talisman of Dominance", 1],
  ["Night's Whisper", 1],
  ["Viscera Seer", 1],
  ["Diabolic Intent", 1],
  ["Village Rites", 1],
  ["Pongify", 1],
  ["Underground Sea", 1],
  ["Temple of Deceit", 1],
  ["Shipwreck Marsh", 1],
  ["Seat of the Synod", 1],
  ["Vault of Whispers", 1],
  ["Sapphire Medallion", 1],
  ["Buried Ruin", 1],
  ["Blood Artist", 2],
  ["Prodigal Sorcerer", 3],
  ["Typhoid Rats", 3],
  ["Mudbutton Torchrunner", 3],
  ["Vampire Nighthawk", 3],
  ["Hypnotic Specter", 2],
  ["Man-o'-War", 2],
  ["Unsummon", 2],
  ["Doom Blade", 2],
  ["Counterspell", 2],
  ["Mind Rot", 1],
  ["Damnation", 1],
  ["Diabolic Edict", 2],
  ["Demonic Tutor", 1],
  ["Preordain", 2],
  ["Opt", 1],
  ["Consider", 2],
  ["Zulaport Cutthroat", 2],
  ["Invisible Stalker", 2],
  ["Greed", 1],
  ["Arcane Signet", 1],
  ["Command Tower", 1],
  ["Underground Mortuary", 1],
  ["Raucous Theater", 1],
  ["Sulfur Falls", 1],
  ["Wooded Foothills", 1],
  ["Bloodstained Mire", 1],
  ["Blood Crypt", 1],
  ["Overgrown Tomb", 1],
  ["Riveteers Overlook", 1],
  ["Tranquil Thicket", 1],
  ["Vernal Fen", 1],
  ["Turbulent Fen", 1],
  ["Festering Thicket", 1],
  ["Manifold Key", 1],
  // Top-500 commanders unblocked by engine work.
  ["Sokka, Tenacious Tactician", 1],
  ["Bria, Riptide Rogue", 1],
  ["Thantis, the Warweaver", 1],
  ["Omnath, Locus of Creation", 1],
  ["Ms. Bumbleflower", 1],
  ["Dogmeat, Ever Loyal", 1],
  ["Chishiro, the Shattered Blade", 1],
  ["Jhoira, Weatherlight Captain", 1],
  ["Thrasios, Triton Hero", 1],
  ["Dr. Madison Li", 1],
  ["Magnus the Red", 1],
  ["Xyris, the Writhing Storm", 1],
  ["Tuvasa the Sunlit", 1],
  ["Prossh, Skyraider of Kher", 1],
  ["The Emperor of Palamecia", 1],
  ["Shalai and Hallar", 1],
  ["Hapatra, Vizier of Poisons", 1],
  ["Norin the Wary", 1],
  ["Kalonian Hydra", 1],
  ["Bonesplitter", 1],
  ["Holy Strength", 1],
  ["Derevi, Empyrial Tactician", 1],
  // Top-2000 staples: X in a spell's mana value, life-change amounts.
  ["Mana Drain", 1],
  ["Sanguine Bond", 1],
  ["Exquisite Blood", 1],
  ["Vito, Thorn of the Dusk Rose", 1],
  ["Psychosis Crawler", 1],
  ["Smothering Tithe", 1],
  ["Ash Barrens", 1],
  ["Displacer Kitten", 1],
  ["Loran of the Third Path", 1],
]);

// The fourth seat's deck: the top-2000 staples authored in one batch (every
// colour, so five of each basic land), so four-player fuzzing exercises them
// from a seat of their own rather than diluting deck B or C.
const deckE = deck([
  ["Accursed Marauder", 1],
  ["Anointed Procession", 1],
  ["Avenger of Zendikar", 1],
  ["Bastion of Remembrance", 1],
  ["Beast Whisperer", 1],
  ["Bedevil", 1],
  ["Blackblade Reforged", 1],
  ["Blazemire Verge", 1],
  ["Bonders' Enclave", 1],
  ["Boros Charm", 1],
  ["Delighted Halfling", 1],
  ["Despark", 1],
  ["Diabolic Tutor", 1],
  ["Dispatch", 1],
  ["Expedition Map", 1],
  ["Exsanguinate", 1],
  ["Fabricate", 1],
  ["Faerie Mastermind", 1],
  ["Fell the Profane", 1],
  ["Goblin Anarchomancer", 1],
  ["Goblin Bombardment", 1],
  ["Golbez, Crystal Collector", 1],
  ["Green Sun's Zenith", 1],
  ["Hedge Maze", 1],
  ["High Market", 1],
  ["Inspiring Call", 1],
  ["Inventors' Fair", 1],
  ["Jetmir, Nexus of Revels", 1],
  ["Liesa, Shroud of Dusk", 1],
  ["Lotho, Corrupt Shirriff", 1],
  ["Mithril Coat", 1],
  ["Mox Opal", 1],
  ["Orcish Bowmasters", 1],
  ["Panharmonicon", 1],
  ["Parallel Lives", 1],
  ["Prismatic Vista", 1],
  ["Prosper, Tome-Bound", 1],
  ["Pyroblast", 1],
  ["Remand", 1],
  ["Reassembling Skeleton", 1],
  ["Spire of Industry", 1],
  ["Sliver Overlord", 1],
  ["Sram, Senior Edificer", 1],
  ["Strip Mine", 1],
  ["Supreme Verdict", 1],
  ["Tainted Field", 1],
  ["Tainted Isle", 1],
  ["Tainted Peak", 1],
  ["Tainted Wood", 1],
  ["Tamiyo's Safekeeping", 1],
  ["Toski, Bearer of Secrets", 1],
  ["Undercity Sewers", 1],
  ["Unexpected Windfall", 1],
  ["Urza's Cave", 1],
  ["Vault of the Archangel", 1],
  ["Warren Soultrader", 1],
  ["Witch Enchanter", 1],
  ["Oloro, Ageless Ascetic", 1],
  ["Blech, Loafing Pest", 1],
  ["Sidar Jabari of Zhalfir", 1],
  ["Hazezon, Shaper of Sand", 1],
  ["Scavenger Grounds", 1],
  ["Morska, Undersea Sleuth", 1],
  ["Alela, Artful Provocateur", 1],
  ["Flight", 1],
  ["Cobbled Wings", 1],
  ["Captain N'ghathrod", 1],
  // Mana abilities with a live amount (power, cards drawn this turn).
  ["Vivi Ornitier", 1],
  ["Marwyn, the Nurturer", 1],
  ["Kydele, Chosen of Kruphix", 1],
  ["Cosmic Spider-Man", 1],
  ["Finneas, Ace Archer", 1],
  // A mana rider that reads a spell's mana value (X included on the stack).
  ["Gilanra, Caller of Wirewood", 1],
  // A target filter comparing against the entering creature's mana value.
  ["Clement, the Worrywort", 1],
  // "Becomes the target of a spell", once per object.
  ["Gargos, Vicious Watcher", 1],
  // Cost modifications keyed on targets, and twobrid pips.
  ["Hinata, Dawn-Crowned", 1],
  ["Reaper King", 1],
  // Finality counters (exile-instead replacements).
  ["Admiral Brass, Unsinkable", 1],
  ["Plains", 5],
  ["Island", 5],
  ["Swamp", 5],
  ["Mountain", 5],
  ["Forest", 5],
]);

// All four seats' decks/commanders, in seating order — sliced down to
// `numPlayers` for a 2-4 player game. Dave plays deckE, with no commander.
const allSeats = [
  { player: A, cards: deckA, commander: "Ureni of the Unwritten" },
  { player: B, cards: deckB, commander: "Atraxa, Praetors' Voice" },
  { player: C, cards: deckC, commander: "Ayara, First of Locthwain" },
  { player: D, cards: deckE },
];
const seats = allSeats.slice(0, numPlayers);

const results = [];
const failures = [];

const workerUrl = new URL("./random-game-worker.mjs", import.meta.url);
const spawn = () => new Worker(workerUrl, { workerData: { seats } });
let worker = spawn();

/** Play one seed in the worker, or kill it after `timeoutMs`. */
const play = (seed) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.removeAllListeners("message");
      // Terminate and replace: the thread may be stuck mid-tick forever.
      void worker.terminate();
      worker = spawn();
      resolve({ seed, ok: false, timedOut: true, ms: timeoutMs });
    }, timeoutMs);
    worker.once("message", (result) => {
      clearTimeout(timer);
      resolve(result);
    });
    worker.postMessage({ seed });
  });

const seedsToPlay =
  onlySeed !== null
    ? [Number(onlySeed)]
    : Array.from({ length: games }, (_, k) => k + 1);

for (const seed of seedsToPlay) {
  if (showProgress) process.stderr.write(`seed ${seed}/${games}… `);
  const result = await play(seed);
  if (result.ok) {
    if (showProgress) {
      process.stderr.write(`${result.turns} turns, ${result.events} events, ${result.ms}ms\n`);
    }
    results.push(result);
  } else if (result.timedOut) {
    const line = `FAILED seed ${seed}: TIMED OUT after ${timeoutMs / 1000}s (replay with --seed ${seed})`;
    process.stderr.write(`${showProgress ? "\n" : ""}${line}\n`);
    failures.push(line);
  } else {
    const line = `FAILED seed ${seed}: ${result.error}`;
    process.stderr.write(`${showProgress ? "\n" : ""}${line}\n`);
    failures.push(`FAILED seed ${seed} (replay with --seed ${seed})`);
  }
}
await worker.terminate();

// `--log` needs the Game object itself, which can't cross the worker boundary.
// Games are deterministic per seed, so replay the last successful one here.
let last = null;
if (showLog && results.length > 0) {
  const seed = results[results.length - 1].seed;
  const rng = createRng(seed * 7919);
  const pick = () => rng.next();
  last = Game.create({
    seed,
    mulligans: true,
    controllers: Object.fromEntries(
      seats.map(({ player }) => [player, new RandomController(player, pick)]),
    ),
    decks: seats,
  });
  last.advance();
}

if (showLog && last !== null) {
  printLog(last);
  printSummary(last);
  console.log("");
}

console.log(`seed  winner  turns  events  reason`);
for (const r of results) {
  console.log(
    `${String(r.seed).padStart(4)}  ${String(r.winner).padEnd(6)}  ${String(
      r.turns,
    ).padStart(5)}  ${String(r.events).padStart(6)}  ${r.reason}`,
  );
}

const wins = (who) => results.filter((r) => r.winner === who).length;
console.log("");
const tally = seats
  .map(({ player }) => `${player} ${wins(player)}`)
  .concat(`draws ${wins("draw")}`)
  .join(", ");
console.log(`${results.length} games — ${tally}`);
console.log(
  `avg turns ${(results.reduce((s, r) => s + r.turns, 0) / Math.max(1, results.length)).toFixed(1)}`,
);
if (failures.length > 0) {
  console.log("");
  console.log(`${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exitCode = 1;
}
