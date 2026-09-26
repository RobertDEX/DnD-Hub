console.info('%c[DUNGEON TOWER] BUILD 20 loaded', 'color:#5ee7ff;font-weight:bold');
// ============================================================
// DUNGEON TOWER — dt.js
// Solo-Leveling-inspired Tower-Climbing RPG · Firebase-synced
// Dark · System · Dungeon · Fantasy
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, doc, collection, getDoc, getDocs, onSnapshot, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const FB_CONFIG = {
  apiKey:"AIzaSyCfEtfiU5swXvVkqt4shp8i6h4JYI8ES7U",authDomain:"dand-3c76a.firebaseapp.com",
  projectId:"dand-3c76a",storageBucket:"dand-3c76a.firebasestorage.app",
  messagingSenderId:"27455098509",appId:"1:27455098509:web:432929f697da9a947d5cc4",measurementId:"G-D1TQM5WJT8"
};
const fbApp = initializeApp(FB_CONFIG, 'dt');
const db    = getFirestore(fbApp);
const DOC   = 'dt-campaign';
const DM_PASS = '123456789';

// ================================================================
// CONSTANTS
// ================================================================
const STATS = ['STR','DEX','CON','INT','WIS','CHA'];
const STAT_LABELS = {
  STR:'Strength', DEX:'Agility', CON:'Vitality', INT:'Intelligence', WIS:'Wisdom', CHA:'Charisma'
};

// Skills — fantasy RPG skill list
const SKILL_DEFS = [
  {name:'STR Save',        stat:'STR', isSave:true},
  {name:'Athletics',       stat:'STR'},
  {name:'DEX Save',        stat:'DEX', isSave:true},
  {name:'Acrobatics',      stat:'DEX'},
  {name:'Stealth',         stat:'DEX'},
  {name:'Sleight of Hand', stat:'DEX'},
  {name:'CON Save',        stat:'CON', isSave:true},
  {name:'Tanking',         stat:'CON'},
  {name:'INT Save',        stat:'INT', isSave:true},
  {name:'Investigation',   stat:'INT'},
  {name:'Arcana',          stat:'INT'},
  {name:'History',         stat:'INT'},
  {name:'Medicine',        stat:'WIS'},
  {name:'WIS Save',        stat:'WIS', isSave:true},
  {name:'Mana Sense',      stat:'WIS'},
  {name:'Perception',      stat:'WIS'},
  {name:'Insight',         stat:'WIS'},
  {name:'Survival',        stat:'WIS'},
  {name:'Nature',          stat:'WIS'},
  {name:'Religion',        stat:'WIS'},
  {name:'CHA Save',        stat:'CHA', isSave:true},
  {name:'Intimidation',    stat:'CHA'},
  {name:'Persuasion',      stat:'CHA'},
  {name:'Deception',       stat:'CHA'}
];

// Full stat names for the grouped skills matrix header — falls back
// to STAT_LABELS which is the canonical map, but this const stays
// available in case we want to swap it for grimmer flavor later.
const STAT_FULL = STAT_LABELS;

// Skill descriptions — dungeon-diving RPG flavor. Kept tight
// and specific so the tooltip fires as clean tactical guidance.
const SKILL_DESCS = {
  // Saves — resistance rolls against being acted on
  'STR Save': 'Resist being moved, held, restrained, or crushed against your will.',
  'DEX Save': 'Dodge blasts, react in time, evade grasping appendages and traps.',
  'CON Save': 'Resist poison, disease, exhaustion, and exposure to anomalous effects.',
  'INT Save': 'Resist mental compulsion, forced recall, and memetic hazards.',
  'WIS Save': 'Resist fear, corruption, madness, and being turned against your team.',
  'CHA Save': 'Resist domination — refuse to have your voice, identity, or will overridden.',

  // STR
  'Athletics': 'Climb, swim, run, jump. Physical endurance in the field.',
  'Force':     'Break, bend, push through, or brute-strength something back.',

  // DEX
  'Acrobatics':      'Balance, tumble, escape restraints, land safely from falls.',
  'Stealth':         'Move silently. Blend into shadows. Avoid being seen.',
  'Sleight of Hand': 'Pick pockets, palm items, quietly disable small devices.',

  // CON
  'Tanking': 'Hold the line. Absorb damage for your party. Endure what others cannot.',

  // INT
  'Investigation': 'Search a room. Reconstruct events. Deduce what happened here.',
  'Arcana': 'Identify spells, enchantments, magical items. Understand mana flows.',
  'History': 'Recall lore about dungeons, monsters, ancient civilizations, and artifacts.',
  'Medicine':      'Stabilize the wounded. Diagnose. Identify what is wrong with them.',

  // WIS
  'Mana Sense': 'Feel mana flows, detect hidden magic, sense enchantments and wards.',
  'Perception':  'Notice sounds, movements, hidden details — mundane awareness.',
  'Insight':     'Read people. Detect lies. Sense hidden motives and intentions.',
  'Survival':    'Track, navigate unfamiliar terrain, endure the elements, find shelter.',

  // CHA
  'Nature': 'Identify plants, beasts, terrain. Understand natural hazards and ecosystems.',
  'Religion': 'Knowledge of gods, rites, prayers, holy symbols, and the undead. Recognize divine magic and sacred sites.',
  'Intimidation': 'Frighten enemies, demand surrender, project dominance and menace.',
  'Persuasion':    'Convince, negotiate, win over. Get civilians to comply.',
  'Intimidation':  'Threaten. Coerce. Dominate through fear.',
  'Deception':     'Lie convincingly. Maintain cover. Misdirect.'
};

const SYSTEM_ARCHETYPES = [{"id":"dragon-king","name":"Dragon King System","baseName":"Dragon King","icon":"\u265b","skill":"Intimidation","desc":"Draconic authority hardens the body and magnifies presence. Discovery grants +1 Intimidation. At higher campaign tiers the GM may evolve this into breath, scale, or dragon-aura skills.","special":""},{"id":"necromancer","name":"Necromancer System","baseName":"Necromancer","icon":"\u2620","skill":"Religion","desc":"A death-aspected System built around undead servants, corpse knowledge, soul residue, and attrition. Discovery grants +1 Religion.","special":""},{"id":"swordsman","name":"Swordsman System","baseName":"Swordsman","icon":"\u2694","skill":"Athletics","desc":"A weapon-specialist System focused on blade mastery, timing, counters, and technique evolution. Discovery grants +1 Athletics.","special":""},{"id":"cultivation","name":"Cultivation System","baseName":"Cultivation","icon":"\u262f","skill":"Arcana","desc":"A progression System built around refining body, energy, meridians, realms, and breakthroughs. Discovery grants +1 Arcana.","special":""},{"id":"merchant","name":"Merchant System","baseName":"Merchant","icon":"\u25c6","skill":"Persuasion","desc":"A commerce System built around appraisal, bargaining, stock and profit. Discovery grants +1 Persuasion and five 5% Tower Exchange discounts.","special":"merchant5"},{"id":"casino","name":"Casino System","baseName":"Casino","icon":"\ud83c\udfb2","skill":"Sleight of Hand","desc":"A risk-and-reward System that turns wagers, streaks and dangerous odds into progression. Discovery grants +1 Sleight of Hand.","special":""},{"id":"berserker","name":"Berserker System","baseName":"Berserker","icon":"\u2739","skill":"Tanking","desc":"A berserker-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Tanking (archetype bonuses are capped at +3 per skill).","special":""},{"id":"archmage","name":"Archmage System","baseName":"Archmage","icon":"\u2726","skill":"Arcana","desc":"A archmage-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"assassin","name":"Assassin System","baseName":"Assassin","icon":"\u25c8","skill":"Stealth","desc":"A assassin-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Stealth (archetype bonuses are capped at +3 per skill).","special":""},{"id":"paladin","name":"Paladin System","baseName":"Paladin","icon":"\u2727","skill":"Religion","desc":"A paladin-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"beast-tamer","name":"Beast Tamer System","baseName":"Beast Tamer","icon":"\u265b","skill":"Nature","desc":"A beast tamer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Nature (archetype bonuses are capped at +3 per skill).","special":""},{"id":"alchemist","name":"Alchemist System","baseName":"Alchemist","icon":"\u2620","skill":"Arcana","desc":"A alchemist-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"blacksmith","name":"Blacksmith System","baseName":"Blacksmith","icon":"\u2694","skill":"Investigation","desc":"A blacksmith-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Investigation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"rune-master","name":"Rune Master System","baseName":"Rune Master","icon":"\u262f","skill":"Arcana","desc":"A rune master-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"summoner","name":"Summoner System","baseName":"Summoner","icon":"\u25c6","skill":"Arcana","desc":"A summoner-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"blood-mage","name":"Blood Mage System","baseName":"Blood Mage","icon":"\ud83c\udfb2","skill":"CON Save","desc":"A blood mage-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 CON Save (archetype bonuses are capped at +3 per skill).","special":""},{"id":"frost-monarch","name":"Frost Monarch System","baseName":"Frost Monarch","icon":"\u2739","skill":"Tanking","desc":"A frost monarch-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Tanking (archetype bonuses are capped at +3 per skill).","special":""},{"id":"flame-emperor","name":"Flame Emperor System","baseName":"Flame Emperor","icon":"\u2726","skill":"Arcana","desc":"A flame emperor-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"storm-lord","name":"Storm Lord System","baseName":"Storm Lord","icon":"\u25c8","skill":"Mana Sense","desc":"A storm lord-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Mana Sense (archetype bonuses are capped at +3 per skill).","special":""},{"id":"earthshaker","name":"Earthshaker System","baseName":"Earthshaker","icon":"\u2727","skill":"Athletics","desc":"A earthshaker-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Athletics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"shadow","name":"Shadow System","baseName":"Shadow","icon":"\u265b","skill":"Stealth","desc":"A shadow-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Stealth (archetype bonuses are capped at +3 per skill).","special":""},{"id":"holy-saint","name":"Holy Saint System","baseName":"Holy Saint","icon":"\u2620","skill":"Medicine","desc":"A holy saint-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Medicine (archetype bonuses are capped at +3 per skill).","special":""},{"id":"demon-lord","name":"Demon Lord System","baseName":"Demon Lord","icon":"\u2694","skill":"Persuasion","desc":"A demon lord-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Persuasion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"hero","name":"Hero System","baseName":"Hero","icon":"\u262f","skill":"Athletics","desc":"A hero-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Athletics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"hunter","name":"Hunter System","baseName":"Hunter","icon":"\u25c6","skill":"Survival","desc":"A hunter-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"dungeon-master","name":"Dungeon Master System","baseName":"Dungeon Master","icon":"\ud83c\udfb2","skill":"Investigation","desc":"A domain-management System centered on rooms, monsters, traps, rewards and dungeon authority. Discovery grants +1 Investigation.","special":""},{"id":"tower-climber","name":"Tower Climber System","baseName":"Tower Climber","icon":"\u2739","skill":"Survival","desc":"A tower climber-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"gacha","name":"Gacha System","baseName":"Gacha","icon":"\u2726","skill":"Sleight of Hand","desc":"A randomized reward System that can dispense traits, skills, abilities and items from a changing pool. Discovery grants +1 Sleight of Hand.","special":""},{"id":"quest","name":"Quest System","baseName":"Quest","icon":"\u25c8","skill":"Investigation","desc":"A directive System that generates objectives, conditions, chains and bonus rewards. Discovery grants +1 Investigation.","special":""},{"id":"training","name":"Training System","baseName":"Training","icon":"\u2727","skill":"Athletics","desc":"A growth System that converts dedicated training into improvements to specific attacks and skills. Discovery grants +1 Athletics.","special":""},{"id":"craftsman","name":"Craftsman System","baseName":"Craftsman","icon":"\u265b","skill":"Investigation","desc":"A craftsman-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Investigation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"artificer","name":"Artificer System","baseName":"Artificer","icon":"\u2620","skill":"Arcana","desc":"A artificer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"engineer","name":"Engineer System","baseName":"Engineer","icon":"\u2694","skill":"Investigation","desc":"A engineer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Investigation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"gunslinger","name":"Gunslinger System","baseName":"Gunslinger","icon":"\u262f","skill":"Perception","desc":"A gunslinger-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Perception (archetype bonuses are capped at +3 per skill).","special":""},{"id":"spearmaster","name":"Spearmaster System","baseName":"Spearmaster","icon":"\u25c6","skill":"Athletics","desc":"A spearmaster-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Athletics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"archer","name":"Archer System","baseName":"Archer","icon":"\ud83c\udfb2","skill":"Perception","desc":"A archer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Perception (archetype bonuses are capped at +3 per skill).","special":""},{"id":"shieldbearer","name":"Shieldbearer System","baseName":"Shieldbearer","icon":"\u2739","skill":"Tanking","desc":"A shieldbearer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Tanking (archetype bonuses are capped at +3 per skill).","special":""},{"id":"monk","name":"Monk System","baseName":"Monk","icon":"\u2726","skill":"Acrobatics","desc":"A monk-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Acrobatics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"warlock","name":"Warlock System","baseName":"Warlock","icon":"\u25c8","skill":"Arcana","desc":"A warlock-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"druid","name":"Druid System","baseName":"Druid","icon":"\u2727","skill":"Nature","desc":"A druid-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Nature (archetype bonuses are capped at +3 per skill).","special":""},{"id":"bard","name":"Bard System","baseName":"Bard","icon":"\u265b","skill":"Persuasion","desc":"A bard-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Persuasion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"thief","name":"Thief System","baseName":"Thief","icon":"\u2620","skill":"Sleight of Hand","desc":"A thief-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Sleight of Hand (archetype bonuses are capped at +3 per skill).","special":""},{"id":"explorer","name":"Explorer System","baseName":"Explorer","icon":"\u2694","skill":"Survival","desc":"A explorer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"pathfinder","name":"Pathfinder System","baseName":"Pathfinder","icon":"\u262f","skill":"Survival","desc":"A pathfinder-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"survivor","name":"Survivor System","baseName":"Survivor","icon":"\u25c6","skill":"CON Save","desc":"A survivor-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 CON Save (archetype bonuses are capped at +3 per skill).","special":""},{"id":"gladiator","name":"Gladiator System","baseName":"Gladiator","icon":"\ud83c\udfb2","skill":"Athletics","desc":"A gladiator-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Athletics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"warlord","name":"Warlord System","baseName":"Warlord","icon":"\u2739","skill":"Intimidation","desc":"A warlord-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Intimidation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"commander","name":"Commander System","baseName":"Commander","icon":"\u2726","skill":"Persuasion","desc":"A commander-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Persuasion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"tactician","name":"Tactician System","baseName":"Tactician","icon":"\u25c8","skill":"Investigation","desc":"A tactician-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Investigation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"strategist","name":"Strategist System","baseName":"Strategist","icon":"\u2727","skill":"History","desc":"A strategist-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 History (archetype bonuses are capped at +3 per skill).","special":""},{"id":"scholar","name":"Scholar System","baseName":"Scholar","icon":"\u265b","skill":"History","desc":"A scholar-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 History (archetype bonuses are capped at +3 per skill).","special":""},{"id":"sage","name":"Sage System","baseName":"Sage","icon":"\u2620","skill":"Insight","desc":"A sage-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Insight (archetype bonuses are capped at +3 per skill).","special":""},{"id":"oracle","name":"Oracle System","baseName":"Oracle","icon":"\u2694","skill":"Insight","desc":"A oracle-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Insight (archetype bonuses are capped at +3 per skill).","special":""},{"id":"seer","name":"Seer System","baseName":"Seer","icon":"\u262f","skill":"Arcana","desc":"A seer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"chronomancer","name":"Chronomancer System","baseName":"Chronomancer","icon":"\u25c6","skill":"Arcana","desc":"A chronomancer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"spatial-mage","name":"Spatial Mage System","baseName":"Spatial Mage","icon":"\ud83c\udfb2","skill":"Arcana","desc":"A spatial mage-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"gravity-lord","name":"Gravity Lord System","baseName":"Gravity Lord","icon":"\u2739","skill":"Arcana","desc":"A gravity lord-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"illusionist","name":"Illusionist System","baseName":"Illusionist","icon":"\u2726","skill":"Deception","desc":"A illusionist-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Deception (archetype bonuses are capped at +3 per skill).","special":""},{"id":"enchanter","name":"Enchanter System","baseName":"Enchanter","icon":"\u25c8","skill":"Arcana","desc":"A enchanter-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"healer","name":"Healer System","baseName":"Healer","icon":"\u2727","skill":"Medicine","desc":"A healer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Medicine (archetype bonuses are capped at +3 per skill).","special":""},{"id":"plague-doctor","name":"Plague Doctor System","baseName":"Plague Doctor","icon":"\u265b","skill":"Medicine","desc":"A plague doctor-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Medicine (archetype bonuses are capped at +3 per skill).","special":""},{"id":"poison-master","name":"Poison Master System","baseName":"Poison Master","icon":"\u2620","skill":"Nature","desc":"A poison master-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Nature (archetype bonuses are capped at +3 per skill).","special":""},{"id":"chef","name":"Chef System","baseName":"Chef","icon":"\u2694","skill":"Nature","desc":"A chef-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Nature (archetype bonuses are capped at +3 per skill).","special":""},{"id":"farmer","name":"Farmer System","baseName":"Farmer","icon":"\u262f","skill":"Survival","desc":"A farmer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"fisherman","name":"Fisherman System","baseName":"Fisherman","icon":"\u25c6","skill":"Athletics","desc":"A fisherman-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Athletics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"miner","name":"Miner System","baseName":"Miner","icon":"\ud83c\udfb2","skill":"Survival","desc":"A miner-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"treasure-hunter","name":"Treasure Hunter System","baseName":"Treasure Hunter","icon":"\u2739","skill":"Investigation","desc":"A treasure hunter-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Investigation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"appraiser","name":"Appraiser System","baseName":"Appraiser","icon":"\u2726","skill":"Insight","desc":"A appraiser-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Insight (archetype bonuses are capped at +3 per skill).","special":""},{"id":"collector","name":"Collector System","baseName":"Collector","icon":"\u25c8","skill":"Persuasion","desc":"A collector-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Persuasion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"auctioneer","name":"Auctioneer System","baseName":"Auctioneer","icon":"\u2727","skill":"Persuasion","desc":"A auctioneer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Persuasion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"banker","name":"Banker System","baseName":"Banker","icon":"\u265b","skill":"Investigation","desc":"A banker-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Investigation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"bounty-hunter","name":"Bounty Hunter System","baseName":"Bounty Hunter","icon":"\u2620","skill":"Survival","desc":"A bounty hunter-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"mercenary","name":"Mercenary System","baseName":"Mercenary","icon":"\u2694","skill":"Intimidation","desc":"A mercenary-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Intimidation (archetype bonuses are capped at +3 per skill).","special":""},{"id":"adventurer","name":"Adventurer System","baseName":"Adventurer","icon":"\u262f","skill":"Survival","desc":"A adventurer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"monster-slayer","name":"Monster Slayer System","baseName":"Monster Slayer","icon":"\u25c6","skill":"Athletics","desc":"A monster slayer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Athletics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"giant-slayer","name":"Giant Slayer System","baseName":"Giant Slayer","icon":"\ud83c\udfb2","skill":"Athletics","desc":"A giant slayer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Athletics (archetype bonuses are capped at +3 per skill).","special":""},{"id":"dragon-slayer","name":"Dragon Slayer System","baseName":"Dragon Slayer","icon":"\u2739","skill":"History","desc":"A dragon slayer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 History (archetype bonuses are capped at +3 per skill).","special":""},{"id":"undead-slayer","name":"Undead Slayer System","baseName":"Undead Slayer","icon":"\u2726","skill":"Religion","desc":"A undead slayer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"demon-slayer","name":"Demon Slayer System","baseName":"Demon Slayer","icon":"\u25c8","skill":"Religion","desc":"A demon slayer-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"spirit-walker","name":"Spirit Walker System","baseName":"Spirit Walker","icon":"\u2727","skill":"Mana Sense","desc":"A spirit walker-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Mana Sense (archetype bonuses are capped at +3 per skill).","special":""},{"id":"soul-reaper","name":"Soul Reaper System","baseName":"Soul Reaper","icon":"\u265b","skill":"Religion","desc":"A soul reaper-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"soul-binder","name":"Soul Binder System","baseName":"Soul Binder","icon":"\u2620","skill":"Arcana","desc":"A soul binder-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"dream-walker","name":"Dream Walker System","baseName":"Dream Walker","icon":"\u2694","skill":"Insight","desc":"A dream walker-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Insight (archetype bonuses are capped at +3 per skill).","special":""},{"id":"nightmare","name":"Nightmare System","baseName":"Nightmare","icon":"\u262f","skill":"WIS Save","desc":"A nightmare-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 WIS Save (archetype bonuses are capped at +3 per skill).","special":""},{"id":"vampire","name":"Vampire System","baseName":"Vampire","icon":"\u25c6","skill":"Stealth","desc":"A vampire-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Stealth (archetype bonuses are capped at +3 per skill).","special":""},{"id":"werewolf","name":"Werewolf System","baseName":"Werewolf","icon":"\ud83c\udfb2","skill":"Survival","desc":"A werewolf-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"phoenix","name":"Phoenix System","baseName":"Phoenix","icon":"\u2739","skill":"CON Save","desc":"A phoenix-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 CON Save (archetype bonuses are capped at +3 per skill).","special":""},{"id":"leviathan","name":"Leviathan System","baseName":"Leviathan","icon":"\u2726","skill":"Survival","desc":"A leviathan-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""},{"id":"titan","name":"Titan System","baseName":"Titan","icon":"\u25c8","skill":"Tanking","desc":"A titan-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Tanking (archetype bonuses are capped at +3 per skill).","special":""},{"id":"celestial","name":"Celestial System","baseName":"Celestial","icon":"\u2727","skill":"Religion","desc":"A celestial-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"void-walker","name":"Void Walker System","baseName":"Void Walker","icon":"\u265b","skill":"Arcana","desc":"A void walker-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"abyssal","name":"Abyssal System","baseName":"Abyssal","icon":"\u2620","skill":"Arcana","desc":"A abyssal-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Arcana (archetype bonuses are capped at +3 per skill).","special":""},{"id":"starcaller","name":"Starcaller System","baseName":"Starcaller","icon":"\u2694","skill":"Religion","desc":"A starcaller-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"moon-priest","name":"Moon Priest System","baseName":"Moon Priest","icon":"\u262f","skill":"Religion","desc":"A moon priest-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"sun-knight","name":"Sun Knight System","baseName":"Sun Knight","icon":"\u25c6","skill":"Insight","desc":"A sun knight-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Insight (archetype bonuses are capped at +3 per skill).","special":""},{"id":"luck","name":"Luck System","baseName":"Luck","icon":"\ud83c\udfb2","skill":"Sleight of Hand","desc":"A luck-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Sleight of Hand (archetype bonuses are capped at +3 per skill).","special":""},{"id":"fate","name":"Fate System","baseName":"Fate","icon":"\u2739","skill":"Insight","desc":"A fate-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Insight (archetype bonuses are capped at +3 per skill).","special":""},{"id":"karma","name":"Karma System","baseName":"Karma","icon":"\u2726","skill":"Religion","desc":"A karma-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Religion (archetype bonuses are capped at +3 per skill).","special":""},{"id":"copycat","name":"Copycat System","baseName":"Copycat","icon":"\u25c8","skill":"Deception","desc":"A copycat-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Deception (archetype bonuses are capped at +3 per skill).","special":""},{"id":"evolution","name":"Evolution System","baseName":"Evolution","icon":"\u2727","skill":"Survival","desc":"A evolution-aligned System archetype. It rewards behavior, techniques and progression that fit its theme. Discovery grants +1 Survival (archetype bonuses are capped at +3 per skill).","special":""}];
const SYSTEM_ARCHIVE_CODE = '987654321';

// Player ranks — Solo Leveling letter-grade system.
// E through S rank, earned through Tower progression.
const RANKS = [
  { id:'E', tier:'E-RANK', title:'E-RANK',  subtitle:'Apprentice',   color:'#7a8590' },
  { id:'D', tier:'D-RANK', title:'D-RANK',  subtitle:'Initiate',     color:'#5a9a78' },
  { id:'C', tier:'C-RANK', title:'C-RANK',  subtitle:'Veteran',      color:'#c2a23a' },
  { id:'B', tier:'B-RANK', title:'B-RANK',  subtitle:'Elite',        color:'#5aa8f5' },
  { id:'A', tier:'A-RANK', title:'A-RANK',  subtitle:'Champion',     color:'#d94f4f' },
  { id:'S', tier:'S-RANK', title:'S-RANK',  subtitle:'Monarch',      color:'#b04ad9' }
];
const RANK_BY_ID = Object.fromEntries(RANKS.map(r=>[r.id,r]));

const PLAYER_CLASSES = [
  { id:'knight',    label:'Knight',    icon:'⚔', color:'#5aa8f5', primary:'STR', desc:'Frontline tank. Heavy armor, sword & shield.' },
  { id:'sorcerer',  label:'Sorcerer',  icon:'🔮', color:'#a462d3', primary:'INT', desc:'Raw arcane power. High damage, fragile.' },
  { id:'priest',    label:'Priest',    icon:'✝', color:'#ffd460', primary:'WIS', desc:'Healer and support. Radiant damage, buffs.' },
  { id:'ranger',    label:'Ranger',    icon:'🏹', color:'#4ade80', primary:'DEX', desc:'Ranged DPS. Traps, beast companions.' },
  { id:'assassin',  label:'Assassin',  icon:'🗡', color:'#c04a5a', primary:'DEX', desc:'Stealth striker. Critical hits, poison.' },
  { id:'berserker', label:'Berserker', icon:'🪓', color:'#e0802a', primary:'STR', desc:'Reckless damage. Rage, cleave, lifesteal.' },
  { id:'necromancer',label:'Necromancer',icon:'💀',color:'#8a5ad1',primary:'INT', desc:'Summons undead. Drains life. Dark magic.' },
  { id:'paladin',   label:'Paladin',   icon:'🛡', color:'#e8a72c', primary:'CHA', desc:'Holy warrior. Smites, heals, auras.' },
  // ─── HIDDEN / ADVANCED CLASSES (DM only, prestige) ───
  { id:'magic_knight',    label:'Magic Knight',      icon:'⚔🔮', color:'#6a8cf5', primary:'STR', desc:'Blade and sorcery combined. Enchants weapons with mana.', hidden:true },
  { id:'lich_lord',       label:'Lich Lord',          icon:'💀👑', color:'#6a2aaa', primary:'INT', desc:'Master of death itself. Commands undead armies. Phylactery bound.', hidden:true },
  { id:'brutal_berserker',label:'Brutal Berserker',   icon:'🪓💀', color:'#c04020', primary:'STR', desc:'Beyond rage. Every kill fuels the next. Unstoppable carnage.', hidden:true },
  { id:'shadow_assassin', label:'Shadow Assassin',    icon:'🗡🌑', color:'#4a1a3a', primary:'DEX', desc:'One with darkness. Can kill from the shadow realm itself.', hidden:true },
  { id:'arch_mage',       label:'Arch Mage',          icon:'🔮✦', color:'#c080ff', primary:'INT', desc:'Transcendent arcane mastery. Bends reality. Infinite mana potential.', hidden:true },
  { id:'high_priest',     label:'High Priest',        icon:'✝✦', color:'#fff0a0', primary:'WIS', desc:'Direct conduit to the divine. Mass resurrection. Absolute healing.', hidden:true },
  { id:'beast_master',    label:'Beast Master',       icon:'🏹🐺', color:'#2aaa60', primary:'DEX', desc:'Commands tamed monsters. Rides dragons. The wild obeys.', hidden:true },
  { id:'shadow_monarch',  label:'Shadow Monarch',     icon:'👁', color:'#1a1a4a', primary:'INT', desc:'Ruler of shadows. Extracts and commands shadow soldiers from the dead. The apex predator.', hidden:true },
  { id:'dragon_knight',   label:'Dragon Knight',      icon:'🐉', color:'#d4a020', primary:'STR', desc:'Bonded to a dragon. Scales as armor. Breath weapon. Flight.', hidden:true },
  { id:'saint',           label:'Saint',              icon:'✦', color:'#ffffff', primary:'WIS', desc:'Ascended beyond mortal limits. Immune to death magic. Aura of salvation.', hidden:true },
];
const CLASS_BY_ID = Object.fromEntries(PLAYER_CLASSES.map(c => [c.id, c]));

const CLASS_BASIC_SKILLS = {
  knight:     [
    { name:'Swordsmanship',  type:'Passive', cost:'—',     cooldown:'—',       desc:'Mastery of blade techniques. +2 to melee attack rolls. Can perform Thrust (single target, +1d6) and Sweep (2 targets, normal damage).' },
    { name:'Shield Bash',    type:'Active',  cost:'15 MP', cooldown:'1 round', desc:'Slam your shield into a target. Deals 2d6 bludgeoning and stuns the target for 1 round. STR save DC 14 negates stun.' }
  ],
  sorcerer:   [
    { name:'Arcane Bolt',    type:'Active',  cost:'10 MP', cooldown:'—',       desc:'Hurl a bolt of pure arcane energy. 3d6 force damage, range 120ft. Spell attack roll.' },
    { name:'Mana Shield',    type:'Active',  cost:'20 MP', cooldown:'3 rounds',desc:'Conjure a barrier of mana. Absorbs up to 30 damage for 1 minute. Excess damage breaks the shield.' }
  ],
  priest:     [
    { name:'Holy Light',     type:'Active',  cost:'15 MP', cooldown:'—',       desc:'Channel radiant energy. Heals 3d8+WIS to one ally, or deals 3d8 radiant to one undead/demon.' },
    { name:'Blessing',       type:'Active',  cost:'25 MP', cooldown:'Long rest',desc:'Bless up to 3 allies. They gain +1d4 to attack rolls and saving throws for 10 minutes.' }
  ],
  ranger:     [
    { name:'Quick Shot',     type:'Active',  cost:'10 MP', cooldown:'—',       desc:'Fire two arrows in rapid succession. Each deals 1d8+DEX piercing. Both can target the same or different enemies.' },
    { name:"Nature's Mark",  type:'Active',  cost:'15 MP', cooldown:'Short rest',desc:'Mark a target. All attacks against it gain advantage for 1 minute. The mark is visible only to your party.' }
  ],
  assassin:   [
    { name:'Backstab',       type:'Passive', cost:'—',     cooldown:'—',       desc:'Attacks from stealth or against surprised targets deal an extra 3d6 damage. Critical hits add another 2d6.' },
    { name:'Shadow Step',    type:'Active',  cost:'20 MP', cooldown:'2 rounds',desc:'Teleport up to 60ft to an unoccupied space you can see. If you appear behind an enemy, your next attack has advantage.' }
  ],
  berserker:  [
    { name:'Rage',           type:'Active',  cost:'20 MP', cooldown:'Short rest',desc:'Enter a berserker rage for 1 minute. +3 to melee damage, resistance to physical damage, but cannot cast spells. Ends early if you take no damage for 1 round.' },
    { name:'Cleave',         type:'Active',  cost:'15 MP', cooldown:'1 round', desc:'A devastating horizontal swing. Hits all enemies within 10ft in a 180° arc. Deals weapon damage +2d6 to each.' }
  ],
  necromancer:[
    { name:'Raise Dead',     type:'Active',  cost:'30 MP', cooldown:'Long rest',desc:'Animate a corpse as an undead servant. It has half the original creature\'s HP and obeys simple commands. Lasts 1 hour or until destroyed.' },
    { name:'Life Drain',     type:'Active',  cost:'15 MP', cooldown:'—',       desc:'Drain life from a target within 30ft. Deals 3d6 necrotic damage and you heal for half the damage dealt.' }
  ],
  paladin:    [
    { name:'Divine Smite',   type:'Active',  cost:'15 MP', cooldown:'—',       desc:'Channel divine energy through your weapon. On a hit, deal an extra 2d8 radiant damage. +1d8 against undead and fiends.' },
    { name:'Lay on Hands',   type:'Active',  cost:'—',     cooldown:'Long rest',desc:'Touch an ally and restore up to 5×your level HP from your divine pool. Can also cure one disease or neutralize one poison.' }
  ],
  // ─── HIDDEN / ADVANCED CLASS SKILLS ───
  magic_knight: [
    { name:'Mana Blade',       type:'Active',  cost:'20 MP', cooldown:'—',       desc:'Infuse your weapon with raw mana. Next 3 attacks deal +2d8 force damage and count as magical.' },
    { name:'Spell Parry',      type:'Passive', cost:'—',     cooldown:'—',       desc:'When targeted by a spell, use your reaction to make a melee attack. On hit, the spell is deflected.' }
  ],
  lich_lord: [
    { name:'Army of the Dead', type:'Active',  cost:'60 MP', cooldown:'Long rest',desc:'Raise up to 6 undead servants simultaneously. They persist until destroyed. You command them telepathically.' },
    { name:'Soul Cage',        type:'Active',  cost:'40 MP', cooldown:'—',       desc:'Trap the soul of a creature that died within 60ft. Consume it to restore 50 HP or ask it one question it must answer truthfully.' }
  ],
  brutal_berserker: [
    { name:'Bloodlust',        type:'Passive', cost:'—',     cooldown:'—',       desc:'Every kill heals you for 2d6 HP and adds +1 damage to your next attack (stacks up to +10).' },
    { name:'Rampage',          type:'Active',  cost:'30 MP', cooldown:'Short rest',desc:'For 3 rounds, you can make one additional attack per turn. Each kill extends the duration by 1 round.' }
  ],
  shadow_assassin: [
    { name:'Shadow Kill',      type:'Active',  cost:'25 MP', cooldown:'—',       desc:'Strike from the shadow realm. Teleport behind target, deal 6d6+DEX piercing. Target cannot use reactions until their next turn.' },
    { name:'Vanish',           type:'Active',  cost:'15 MP', cooldown:'2 rounds',desc:'Become completely invisible and intangible for 1 round. You can move through creatures and walls up to 5ft thick.' }
  ],
  arch_mage: [
    { name:'Mana Overflow',    type:'Active',  cost:'50 MP', cooldown:'Long rest',desc:'For 1 minute, all spell damage is doubled and spell MP costs are halved. Mana regenerates 10/round.' },
    { name:'Reality Warp',     type:'Active',  cost:'80 MP', cooldown:'Long rest',desc:'Reshape a 30ft cube of reality. Transmute matter, create terrain, or undo damage to structures and creatures within.' }
  ],
  high_priest: [
    { name:'Mass Resurrection', type:'Active', cost:'100 MP',cooldown:'Long rest',desc:'Resurrect up to 4 dead allies within 60ft to full HP. Removes all conditions. The light blinds undead within 120ft for 8d8 radiant.' },
    { name:'Divine Aegis',      type:'Active', cost:'40 MP', cooldown:'Short rest',desc:'Create a 30ft aura for 10 minutes. All allies inside gain +2 AC, resistance to all damage, and immunity to fear and charm.' }
  ],
  beast_master: [
    { name:'Tame Monster',     type:'Active',  cost:'30 MP', cooldown:'Long rest',desc:'Attempt to bond with a monster. WIS save DC equals your spell DC. On success, it becomes your permanent companion (max 2).' },
    { name:'Pack Tactics',     type:'Passive', cost:'—',     cooldown:'—',       desc:'You and your tamed beasts have advantage on attack rolls against a creature if at least one beast is within 5ft of it.' }
  ],
  shadow_monarch: [
    { name:"Ruler's Authority",type:'Active',  cost:'40 MP', cooldown:'—',       desc:'Telekinesis — move any object or creature up to 300lbs. Can crush, throw, or restrain. STR save to resist.' },
    { name:'Shadow Extraction',type:'Active',  cost:'50 MP', cooldown:'—',       desc:'Extract the shadow of a slain enemy. It becomes a permanent shadow soldier under your command. No limit on army size.' }
  ],
  dragon_knight: [
    { name:'Dragon Bond',      type:'Passive', cost:'—',     cooldown:'—',       desc:'You are bonded to a dragon. Gain fire resistance, +2 AC from scales, and can summon your dragon once per long rest.' },
    { name:'Breath Weapon',    type:'Active',  cost:'35 MP', cooldown:'Short rest',desc:'Channel your dragon\'s breath. 60ft cone, 8d6 fire/cold/lightning damage (matches your dragon). DEX save for half.' }
  ],
  saint: [
    { name:'Aura of Salvation',type:'Passive', cost:'—',     cooldown:'—',       desc:'All allies within 30ft heal 1d4 HP at the start of each of your turns. Undead within range take 1d4 radiant damage.' },
    { name:'Miracle',          type:'Active',  cost:'100 MP',cooldown:'Long rest',desc:'Request a miracle from the divine. The DM determines the outcome, but the effect can duplicate any spell of 8th level or lower.' }
  ]
};

const RARITY_COLORS = { common:'#9aa6b2', uncommon:'#5a9a78', rare:'#5aa8f5', epic:'#a462d3', legendary:'#e8a72c' };

// Threat grades for missions / anomalies and their point bounties
const THREAT_GRADES = [
  { grade:'E', points:100,    color:'#7a8590', label:'Easy' },
  { grade:'D', points:300,    color:'#5a9a78', label:'Normal' },
  { grade:'C', points:2700,   color:'#c2a23a', label:'Hard' },
  { grade:'B', points:75000,  color:'#5aa8f5', label:'Very Hard' },
  { grade:'A', points:100000, color:'#d94f4f', label:'Deadly' },
  { grade:'S', points:200000, color:'#b04ad9', label:'Catastrophic' }
];
const THREAT_BY_GRADE = Object.fromEntries(THREAT_GRADES.map(t=>[t.grade,t]));

// Monster types for the Tower bestiary
const ANOMALY_CLASSES = ['Beast','Undead','Demon','Dragon','Elemental','Construct','Aberration','Humanoid'];

// Damage types — mundane, elemental, divine, arcane. Each character
// can have a set they RESIST (half damage), a set they're VULNERABLE to
// (double damage), and a set they're IMMUNE to (no damage).
const DAMAGE_TYPES = [
  { id:'physical',  label:'Physical',  cat:'mundane',    icon:'⚔', desc:'Slashing, piercing, and bludgeoning damage.' },
  { id:'fire',      label:'Fire',      cat:'elemental',  icon:'🔥', desc:'Flames, lava, and burning heat.' },
  { id:'cold',      label:'Cold',      cat:'elemental',  icon:'❄', desc:'Ice, frost, and freezing cold.' },
  { id:'lightning', label:'Lightning',  cat:'elemental',  icon:'⚡', desc:'Electric bolts and chain lightning.' },
  { id:'acid',      label:'Acid',      cat:'elemental',  icon:'⚠', desc:'Corrosive substances and dissolving attacks.' },
  { id:'radiant',   label:'Radiant',   cat:'divine',     icon:'✦', desc:'Holy light, divine power, sacred energy.' },
  { id:'necrotic',  label:'Necrotic',  cat:'divine',     icon:'💀', desc:'Life-draining rot, death magic, undeath.' },
  { id:'psychic',   label:'Psychic',   cat:'arcane',     icon:'👁', desc:'Mind-rending attacks, psionic force.' },
  { id:'force',     label:'Force',     cat:'arcane',     icon:'◆', desc:'Pure magical force — raw mana made lethal.' },
  { id:'poison',    label:'Poison',    cat:'mundane',    icon:'🐍', desc:'Venoms, toxins, and poisonous gases.' },
  { id:'thunder',   label:'Thunder',   cat:'elemental',  icon:'💥', desc:'Concussive blasts and sonic damage.' },
];
const DAMAGE_TYPE_BY_ID = Object.fromEntries(DAMAGE_TYPES.map(t => [t.id, t]));

const DMG_TYPES = ['Slashing','Bludgeoning','Piercing','Fire','Cold','Lightning','Acid','Radiant','Necrotic','Psychic','Force','Poison','Thunder'];
const TRAINING  = ['Untrained','Trained','Master'];
const ITEM_CATEGORIES = ['Weapon','Armor','Accessory','Consumable','Skill Stone','Rune Stone','Loot Box','Material','Utility','Anomalous','Misc'];

// Shop categories + tier access
const SHOP_CATEGORIES = ['Consumables','Weapons','Armor','Accessories','Skill Stones','Rune Stones','Loot Boxes','Materials','Utilities'];

// ================================================================
// BUILT-IN TOWER SHOP CATALOG — fallback + expanded stock
// The external MAW_DEFAULT_SHOP is still supported; this catalog means
// Dungeon Tower no longer depends on another campaign folder to stock itself.
// ================================================================
const DT_DEFAULT_SHOP = [
  // ── CONSUMABLES ──
  {tier:1,category:'Consumables',rarity:'common',icon:'🧪',name:'Minor Healing Potion',price:35,stats:'Restore 10 HP',desc:'Basic red recovery potion issued to low-floor delvers.',effect:{kind:'healHp',amount:10}},
  {tier:1,category:'Consumables',rarity:'common',icon:'💧',name:'Minor Mana Potion',price:40,stats:'Restore 10 MP',desc:'Condensed mana solution. Bitter, effective.',effect:{kind:'healMp',amount:10}},
  {tier:1,category:'Consumables',rarity:'common',icon:'🍖',name:'Hunter Ration Pack',price:18,stats:'Fatigue −8',desc:'Dense field meal with salts, protein and alchemical stimulants.',effect:{kind:'fatigue',amount:-8}},
  {tier:1,category:'Consumables',rarity:'uncommon',icon:'🩹',name:'Emergency Trauma Kit',price:80,stats:'Restore 20 HP',desc:'Bandages, clot foam and a single-use restorative injector.',effect:{kind:'healHp',amount:20}},
  {tier:1,category:'Consumables',rarity:'uncommon',icon:'✨',name:'Purification Ampoule',price:95,stats:'Cleanse aid',desc:'Counteragent for common toxins, dungeon spores and minor corruption.'},
  {tier:2,category:'Consumables',rarity:'uncommon',icon:'🧪',name:'Greater Healing Potion',price:180,stats:'Restore 35 HP',desc:'High-concentration recovery draught.',effect:{kind:'healHp',amount:35}},
  {tier:2,category:'Consumables',rarity:'uncommon',icon:'💧',name:'Greater Mana Potion',price:195,stats:'Restore 35 MP',desc:'Refills a large portion of a mid-rank caster’s mana reserve.',effect:{kind:'healMp',amount:35}},
  {tier:2,category:'Consumables',rarity:'rare',icon:'💠',name:'Dual Recovery Elixir',price:320,stats:'HP +25 · MP +25',desc:'Two-phase potion restoring body and mana channels together.',effect:{kind:'restoreBoth',hp:25,mp:25}},
  {tier:2,category:'Consumables',rarity:'rare',icon:'🌙',name:'Nightwatch Serum',price:240,stats:'Fatigue −25',desc:'Temporarily suppresses exhaustion without the usual crash.',effect:{kind:'fatigue',amount:-25}},
  {tier:3,category:'Consumables',rarity:'rare',icon:'❤️',name:'Superior Healing Potion',price:600,stats:'Restore 80 HP',desc:'Premium recovery potion used by high-rank raid teams.',effect:{kind:'healHp',amount:80}},
  {tier:3,category:'Consumables',rarity:'rare',icon:'🔷',name:'Superior Mana Potion',price:650,stats:'Restore 80 MP',desc:'Highly refined liquid mana.',effect:{kind:'healMp',amount:80}},
  {tier:3,category:'Consumables',rarity:'epic',icon:'🛡️',name:'Ironblood Tonic',price:900,stats:'+25 Temp HP',desc:'Hardens the body with a short-lived mana shell.',effect:{kind:'tempHp',amount:25}},
  {tier:4,category:'Consumables',rarity:'epic',icon:'🌟',name:'Phoenix Tear',price:2400,stats:'Full HP · Fatigue 0',desc:'Extremely rare regenerative essence. Not resurrection.',effect:{kind:'phoenix'}},
  {tier:4,category:'Consumables',rarity:'legendary',icon:'💎',name:'Monarch Recovery Elixir',price:5000,stats:'Full HP & MP',desc:'A sealed black-gold vial reserved for S-rank clear teams.',effect:{kind:'fullRestore'}},

  // ── WEAPONS ──
  {tier:1,category:'Weapons',rarity:'common',icon:'⚔️',name:'Tower Steel Longsword',price:120,stats:'1d8 Slashing',desc:'Reliable forged steel balanced for dungeon fighting.'},
  {tier:1,category:'Weapons',rarity:'common',icon:'🗡️',name:'Delver Shortsword',price:85,stats:'1d6 Slashing',desc:'Compact sidearm for tight corridors.'},
  {tier:1,category:'Weapons',rarity:'common',icon:'🏹',name:'Composite Hunter Bow',price:130,stats:'1d8 Piercing · 120 ft',desc:'Reinforced bow built for mana-resistant monster hide.'},
  {tier:1,category:'Weapons',rarity:'uncommon',icon:'🔨',name:'Gatebreaker Maul',price:220,stats:'2d6 Bludgeoning',desc:'Heavy demolition weapon for armored beasts and doors.'},
  {tier:2,category:'Weapons',rarity:'uncommon',icon:'⚔️',name:'Mana-Edged Saber',price:450,stats:'1d8 Slashing · Magical',desc:'A mana-conductive blade able to wound incorporeal threats.'},
  {tier:2,category:'Weapons',rarity:'uncommon',icon:'🗡️',name:'Shadowfang Daggers',price:500,stats:'1d6 Piercing · Pair',desc:'Matte-black paired blades favored by assassins.'},
  {tier:2,category:'Weapons',rarity:'rare',icon:'🏹',name:'Stormstring Bow',price:750,stats:'1d10 Piercing',desc:'Runed limbs accelerate arrows with compressed air.'},
  {tier:2,category:'Weapons',rarity:'rare',icon:'🪓',name:'Ogrecleaver Axe',price:820,stats:'1d12 Slashing',desc:'Broad execution axe made from monster-alloy steel.'},
  {tier:3,category:'Weapons',rarity:'rare',icon:'⚔️',name:'Blue Flame Blade',price:1600,stats:'1d8 + 1d6 Fire',desc:'A rune-fed sword whose edge burns cobalt blue.'},
  {tier:3,category:'Weapons',rarity:'epic',icon:'🔱',name:'Abyssal Glaive',price:2200,stats:'1d10 Force · Reach',desc:'Polearm recovered from a deep-floor guardian cache.'},
  {tier:3,category:'Weapons',rarity:'epic',icon:'🔮',name:'Archmage Focus Staff',price:2600,stats:'+1 spell attacks',desc:'Amplifies spell shaping and stabilizes high-output casting.'},
  {tier:4,category:'Weapons',rarity:'legendary',icon:'🗡️',name:'Kingkiller',price:7000,stats:'2d8 Slashing · Magical',desc:'A black relic blade bearing the marks of slain floor lords.'},

  // ── ARMOR ──
  {tier:1,category:'Armor',rarity:'common',icon:'🥋',name:'Padded Delver Jacket',price:90,stats:'Light protection',desc:'Flexible layered cloth with reinforced joints.'},
  {tier:1,category:'Armor',rarity:'common',icon:'🛡️',name:'Iron Scale Vest',price:160,stats:'Medium armor',desc:'Overlapping steel plates over a padded underlayer.'},
  {tier:1,category:'Armor',rarity:'uncommon',icon:'⛑️',name:'Hunter Helm',price:110,stats:'Head protection',desc:'Visored helm with low-light crystal mount.'},
  {tier:2,category:'Armor',rarity:'uncommon',icon:'🛡️',name:'Manaweave Coat',price:420,stats:'Arcane-lined light armor',desc:'Woven mana threads disperse glancing magical impacts.'},
  {tier:2,category:'Armor',rarity:'rare',icon:'🛡️',name:'Basilisk Scale Mail',price:950,stats:'Heavy · Poison resistant',desc:'Layered monster scales treated against venom and acid.'},
  {tier:3,category:'Armor',rarity:'rare',icon:'🛡️',name:'Guardian Plate',price:1900,stats:'Heavy armor',desc:'Raid-grade plate reinforced with dungeon crystal ribs.'},
  {tier:3,category:'Armor',rarity:'epic',icon:'🌑',name:'Nightstalker Mantle',price:2400,stats:'Stealth-oriented',desc:'Dark textile that drinks ambient light and muffles movement.'},
  {tier:4,category:'Armor',rarity:'legendary',icon:'👑',name:'Monarch Carapace',price:8000,stats:'Relic heavy armor',desc:'Living black armor harvested from an S-rank guardian.'},

  // ── ACCESSORIES ──
  {tier:1,category:'Accessories',rarity:'common',icon:'💍',name:'Copper Mana Ring',price:75,stats:'+minor mana focus',desc:'Beginner focus ring etched with a simple circuit.'},
  {tier:1,category:'Accessories',rarity:'uncommon',icon:'🧿',name:'Watcher Charm',price:140,stats:'Awareness aid',desc:'Vibrates faintly near concealed magical activity.'},
  {tier:1,category:'Accessories',rarity:'uncommon',icon:'👢',name:'Delver Boots',price:180,stats:'Traversal aid',desc:'Grip runes improve footing on unstable dungeon terrain.'},
  {tier:2,category:'Accessories',rarity:'uncommon',icon:'📿',name:'Vitality Pendant',price:480,stats:'Endurance focus',desc:'Warm crimson stone often worn by frontline hunters.'},
  {tier:2,category:'Accessories',rarity:'rare',icon:'💍',name:'Ring of Quickcasting',price:700,stats:'Casting focus',desc:'Reduces hesitation when shaping simple spells under pressure.'},
  {tier:2,category:'Accessories',rarity:'rare',icon:'🧤',name:'Titan Grip Bracers',price:760,stats:'Strength focus',desc:'Reinforced bracers that channel force through the forearms.'},
  {tier:3,category:'Accessories',rarity:'epic',icon:'👁️',name:'Third-Eye Lens',price:1800,stats:'Mana Sense focus',desc:'Crystal monocle revealing distortions in mana flow.'},
  {tier:3,category:'Accessories',rarity:'epic',icon:'🧣',name:'Blinkstep Scarf',price:2100,stats:'Mobility relic',desc:'Spatial threads momentarily lighten the wearer during evasive movement.'},
  {tier:4,category:'Accessories',rarity:'legendary',icon:'💠',name:'Heart of the Gate',price:6500,stats:'S-rank relic',desc:'A stabilized gate shard worn inside a containment pendant.'},

  // ── SKILL STONES ──
  {tier:1,category:'Skill Stones',rarity:'uncommon',icon:'💎',name:'Minor Skill Stone',price:350,stats:'Random low-tier skill',desc:'A weak crystallized technique. GM determines contained skill.'},
  {tier:2,category:'Skill Stones',rarity:'rare',icon:'💎',name:'Refined Skill Stone',price:950,stats:'Random mid-tier skill',desc:'Stable skill crystal recovered from elite monsters.'},
  {tier:3,category:'Skill Stones',rarity:'epic',icon:'💎',name:'Boss Skill Stone',price:3000,stats:'Boss-class technique',desc:'Condensed skill core from a floor boss.'},
  {tier:4,category:'Skill Stones',rarity:'legendary',icon:'💎',name:'Sovereign Skill Stone',price:9000,stats:'Unique skill',desc:'A one-of-a-kind crystal with an unidentified sovereign technique.'},

  // ── RUNE STONES ──
  {tier:1,category:'Rune Stones',rarity:'uncommon',icon:'ᚱ',name:'Rune of Vigor',price:260,stats:'Vitality rune',desc:'Socketable rune associated with resilience and recovery.'},
  {tier:1,category:'Rune Stones',rarity:'uncommon',icon:'ᚲ',name:'Rune of Swiftness',price:260,stats:'Agility rune',desc:'Socketable rune designed for movement-oriented equipment.'},
  {tier:1,category:'Rune Stones',rarity:'uncommon',icon:'ᚨ',name:'Rune of Focus',price:280,stats:'Mana rune',desc:'Improves stability of enchanted equipment.'},
  {tier:2,category:'Rune Stones',rarity:'rare',icon:'🔥',name:'Flame Rune',price:700,stats:'Fire enchantment',desc:'Adds a fire-aspected property when socketed by the GM.'},
  {tier:2,category:'Rune Stones',rarity:'rare',icon:'❄️',name:'Frost Rune',price:700,stats:'Cold enchantment',desc:'Adds a cold-aspected property when socketed by the GM.'},
  {tier:2,category:'Rune Stones',rarity:'rare',icon:'⚡',name:'Storm Rune',price:760,stats:'Lightning enchantment',desc:'Adds a lightning-aspected property when socketed by the GM.'},
  {tier:3,category:'Rune Stones',rarity:'epic',icon:'◆',name:'Force Rune',price:1900,stats:'Force enchantment',desc:'Rare rune that reinforces attacks with pure mana force.'},
  {tier:3,category:'Rune Stones',rarity:'epic',icon:'☠️',name:'Vampiric Rune',price:2600,stats:'Life-drain property',desc:'Restricted black rune. Exact effect is set by the GM.'},
  {tier:4,category:'Rune Stones',rarity:'legendary',icon:'♛',name:'Monarch Rune',price:8500,stats:'Relic socket',desc:'A sovereign-grade rune that can redefine an item.'},

  // ── LOOT BOXES ──
  {tier:1,category:'Loot Boxes',rarity:'common',icon:'📦',name:'Bronze Hunter Cache',price:100,stats:'Random reward',desc:'Contains gold or a low-tier supply.',effect:{kind:'lootBox',tier:1}},
  {tier:1,category:'Loot Boxes',rarity:'uncommon',icon:'🎁',name:'Silver Hunter Cache',price:275,stats:'Random reward',desc:'Improved random cache with better payout odds.',effect:{kind:'lootBox',tier:2}},
  {tier:2,category:'Loot Boxes',rarity:'rare',icon:'🧰',name:'Gold Raid Cache',price:700,stats:'Random reward',desc:'Raid-quality randomized supplies and currency.',effect:{kind:'lootBox',tier:3}},
  {tier:3,category:'Loot Boxes',rarity:'epic',icon:'🗃️',name:'Boss Treasury Box',price:2200,stats:'High-tier random reward',desc:'Sealed boss-room chest token.',effect:{kind:'lootBox',tier:4}},
  {tier:4,category:'Loot Boxes',rarity:'legendary',icon:'👑',name:'Monarch Reliquary',price:7000,stats:'Relic-tier random reward',desc:'Extremely expensive sealed reliquary. No guarantees.',effect:{kind:'lootBox',tier:5}},

  // ── MATERIALS ──
  {tier:1,category:'Materials',rarity:'common',icon:'🦴',name:'Monster Bone Bundle',price:40,stats:'Crafting material',desc:'Cleaned structural bone from common Tower beasts.'},
  {tier:1,category:'Materials',rarity:'common',icon:'🪨',name:'Mana Crystal Shard',price:55,stats:'Crafting material',desc:'Low-grade crystal used in repairs and enchantment.'},
  {tier:2,category:'Materials',rarity:'uncommon',icon:'🐉',name:'Wyvern Scale',price:320,stats:'Rare material',desc:'Heat-resistant scale valued by armor smiths.'},
  {tier:2,category:'Materials',rarity:'rare',icon:'💜',name:'Condensed Mana Core',price:650,stats:'Rare material',desc:'Dense core useful for advanced enchantment.'},
  {tier:3,category:'Materials',rarity:'epic',icon:'🖤',name:'Abyssal Alloy Ingot',price:1800,stats:'Epic material',desc:'Black metal that remains cold even in a forge.'},
  {tier:4,category:'Materials',rarity:'legendary',icon:'💠',name:'Sovereign Core Fragment',price:6000,stats:'Relic material',desc:'Fragment from an entity far above normal floor guardians.'},

  // ── UTILITIES ──
  {tier:1,category:'Utilities',rarity:'common',icon:'🕯️',name:'Everlight Lantern',price:45,stats:'Permanent light',desc:'Mana-powered lantern that does not consume oil.'},
  {tier:1,category:'Utilities',rarity:'common',icon:'🪢',name:'Climber Kit',price:60,stats:'Rope · pitons · hooks',desc:'Standard vertical exploration kit.'},
  {tier:1,category:'Utilities',rarity:'common',icon:'🧭',name:'Gate Compass',price:90,stats:'Navigation aid',desc:'Points toward the strongest nearby gate signature.'},
  {tier:1,category:'Utilities',rarity:'uncommon',icon:'📜',name:'Identification Scroll',price:125,stats:'Identify item',desc:'Single-use appraisal script for unknown magical equipment.'},
  {tier:1,category:'Utilities',rarity:'uncommon',icon:'⛺',name:'Portable Safe Camp',price:180,stats:'Camp utility',desc:'Compact ward stakes, heat sheet and alarm wire.'},
  {tier:2,category:'Utilities',rarity:'uncommon',icon:'📡',name:'Party Beacon',price:400,stats:'Tracking aid',desc:'Paired mana beacon for finding separated party members.'},
  {tier:2,category:'Utilities',rarity:'rare',icon:'🗺️',name:'Floor Mapping Drone',price:800,stats:'Mapping utility',desc:'Small crystal construct that records explored corridors.'},
  {tier:2,category:'Utilities',rarity:'rare',icon:'🔐',name:'Sealbreaker Kit',price:950,stats:'Lock/ward utility',desc:'Tools for mundane locks and low-grade magical seals.'},
  {tier:3,category:'Utilities',rarity:'epic',icon:'🏕️',name:'Sanctuary Field Projector',price:2400,stats:'Temporary safe zone',desc:'Creates a short-lived defensive camp barrier.'},
  {tier:3,category:'Utilities',rarity:'epic',icon:'🌀',name:'Emergency Return Stone',price:3000,stats:'Extraction utility',desc:'GM-controlled emergency extraction token for catastrophic runs.'},
  {tier:4,category:'Utilities',rarity:'legendary',icon:'🔑',name:'Master Gate Key',price:10000,stats:'Restricted utility',desc:'Relic key used by the GM to authorize exceptional gate interactions.'}
];

function getDefaultTowerShop(){
  const external = Array.isArray(window.MAW_DEFAULT_SHOP) ? window.MAW_DEFAULT_SHOP : [];
  const merged = [...DT_DEFAULT_SHOP, ...external];
  const seen = new Set();
  return merged.filter(item=>{
    const key=String(item?.name||'').trim().toLowerCase();
    if(!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}


const QUEST_TYPES = {
  main:      { label:'Main Quest',  icon:'⚔', color:'#d94f4f' },
  side:      { label:'Side Quest',  icon:'◆', color:'#4a8bf5' },
  daily:     { label:'Daily',       icon:'☀', color:'#4ade80' },
  emergency: { label:'Emergency',   icon:'⚠', color:'#e8a72c' },
  hunt:      { label:'Hunt',        icon:'🎯', color:'#c04a5a' }
};
const RANK_TO_TIER = { 'E':1, 'D':2, 'C':3, 'B':4, 'A':4, 'S':4 };   // an agent of rank R can access all tiers <= R
const TIER_LABEL = { 1:'E-RANK', 2:'D-RANK', 3:'C-RANK', 4:'B-RANK+' };
const TIER_COLOR = { 1:'#7a8590', 2:'#9aa6b2', 3:'#c2b067', 4:'#d94f4f' };

// ================================================================
// STATE
// ================================================================
const MY_PRESENCE_ID = localStorage.getItem('dt-pid') || (() => {
  const id = Math.random().toString(36).slice(2);
  localStorage.setItem('dt-pid', id); return id;
})();

let dmUnlocked = sessionStorage.getItem('dt-dm') === '1';
let spectator  = sessionStorage.getItem('dt-spectator') === '1';
let _lastAppliedRaw = null;
let _claimReconciled = false;  // runs once per session to drop stale claims


// ── DATA RECOVERY / SNAPSHOT SAFETY ─────────────────────────────
// Keep the raw Firebase payload separate from normalized UI state.
// This lets us prove whether data was already blank in Firestore or
// whether normalization damaged it, and gives us rolling local recovery.
let _lastRawSnapshot = null;
let _lastParsedSnapshot = null;
let _snapshotQuarantined = false;
let _snapshotQuarantineReason = '';
const RECOVERY_KEY = 'dt-recovery-v15';
const RECOVERY_MAX = 20;

function cloneJson(v){
  try { return JSON.parse(JSON.stringify(v)); } catch(_) { return null; }
}
function characterDataScore(c){
  if(!c || typeof c!=='object') return 0;
  let n = 0;
  if(String(c.name||'').trim()) n += 8;
  if(String(c.codename||'').trim()) n += 2;
  if(String(c.playerClass||'none') !== 'none') n += 5;
  if(Number(c.systemLevel||c.level||1) > 1) n += 4;
  if(Number(c.gold||0) > 0) n += 2;
  if(Number(c.exp||0) > 0) n += 2;
  const hp = c.hp || {};
  const mana = c.mana || c.sanity || {};
  if(Number(hp.max||0) > 0) n += 3;
  if(Number(mana.max||0) > 0) n += 3;
  const stats = c.stats || {};
  if(Object.values(stats).some(v=>Number(v)!==8 && Number(v)!==0)) n += 4;
  const sys = c.systemStats || {};
  if(Object.values(sys).some(v=>Number(v)>0)) n += 4;
  ['skills','inventory','weapons','abilities','quests','titles','relationships'].forEach(k=>{
    const v=c[k];
    if(Array.isArray(v) && v.length) n += 2;
    else if(v && typeof v==='object' && Object.keys(v).length) n += 1;
  });
  return n;
}
function campaignDataScore(obj){
  if(!obj || typeof obj!=='object') return 0;
  const chars = Array.isArray(obj.characters) ? obj.characters : [];
  let score = chars.reduce((s,c)=>s+characterDataScore(c),0);
  if(Array.isArray(obj.customClasses) && obj.customClasses.length) score += obj.customClasses.length*3;
  if(Array.isArray(obj.shop) && obj.shop.length) score += 2;
  if(Array.isArray(obj.cases) && obj.cases.length) score += 2;
  if(Array.isArray(obj.sites) && obj.sites.length) score += 2;
  return score;
}
function isSuspiciousBlankCampaign(obj){
  const chars = Array.isArray(obj?.characters) ? obj.characters : [];
  if(!chars.length) return true;
  const named = chars.filter(c=>String(c?.name||'').trim()).length;
  const meaningful = chars.filter(c=>characterDataScore(c)>=8).length;
  return named===0 && meaningful===0;
}
function readRecoveryCopies(){
  try{
    const v=JSON.parse(localStorage.getItem(RECOVERY_KEY)||'[]');
    return Array.isArray(v)?v:[];
  }catch(_){ return []; }
}
function saveRecoveryCopy(raw, parsed, source='firebase'){
  if(typeof raw!=='string' || !raw.length || !parsed || typeof parsed!=='object') return;
  const copies=readRecoveryCopies();
  const score=campaignDataScore(parsed);
  const signature=raw.length+':'+raw.slice(0,80)+':'+raw.slice(-80);
  if(copies[0]?.signature===signature) return;
  copies.unshift({
    at:new Date().toISOString(),
    source,
    score,
    suspicious:isSuspiciousBlankCampaign(parsed),
    chars:Array.isArray(parsed.characters)?parsed.characters.length:0,
    names:Array.isArray(parsed.characters)?parsed.characters.map(c=>String(c?.name||'').trim()).filter(Boolean).slice(0,12):[],
    raw,
    signature
  });
  try{ localStorage.setItem(RECOVERY_KEY, JSON.stringify(copies.slice(0,RECOVERY_MAX))); }
  catch(e){ console.warn('[DT recovery] local backup could not be stored:', e); }
}
function bestRecoveryCopy(){
  return readRecoveryCopies()
    .filter(x=>x && typeof x.raw==='string')
    .sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0))[0] || null;
}
function recoverySummary(){
  const copies=readRecoveryCopies();
  return {
    rawSnapshotAvailable: typeof _lastRawSnapshot==='string',
    rawBytes: _lastRawSnapshot?.length || 0,
    rawScore: campaignDataScore(_lastParsedSnapshot),
    rawSuspicious: isSuspiciousBlankCampaign(_lastParsedSnapshot),
    quarantined:_snapshotQuarantined,
    reason:_snapshotQuarantineReason,
    localCopies:copies.map((x,i)=>({index:i,at:x.at,source:x.source,score:x.score,suspicious:x.suspicious,chars:x.chars,names:x.names}))
  };
}

// ── Debug tools — available as window.dtDebug in browser console ──
window.dtDebug = {
  state()         { return cloneJson(state); },
  snapshotStatus(){ return { received:_firstSnapshotReceived, chars:state.characters.length, dmUnlocked, spectator, quarantined:_snapshotQuarantined, reason:_snapshotQuarantineReason }; },
  rawSnapshot()   { return cloneJson(_lastParsedSnapshot); },
  rawText()       { return _lastRawSnapshot; },
  recoveryStatus(){ return recoverySummary(); },
  recoveryCopies(){ return recoverySummary().localCopies; },
  char(i)         { return state.characters[i ?? state.selectedCharacter]; },
  expTable(n=25) {
    let cumul = 0;
    for(let l=1;l<=n;l++){ const e=expForLevel(l); cumul+=e; console.log(`Lv.${l}→${l+1}: ${e} EXP (cumul: ${cumul}, DnD ${dndLevelFromSystem(l)})`); }
  },
  stateSize()     { return JSON.stringify(state).length; },
  forceRender()   { render(); },
  async forcePush(){
    if(_snapshotQuarantined) throw new Error('Push blocked: suspicious Firebase snapshot is quarantined. Recover/inspect data first.');
    return pushState(true);
  },
  previewRecovery(index=0){
    const copy=readRecoveryCopies()[index];
    return copy ? cloneJson(JSON.parse(copy.raw)) : null;
  },
  restoreRecovery(index=0){
    const copy=readRecoveryCopies()[index];
    if(!copy) throw new Error('Recovery copy not found.');
    const parsed=JSON.parse(copy.raw);
    const recovered=normalize(parsed);
    state = recovered;
    _snapshotQuarantined = true;
    _snapshotQuarantineReason = 'Local recovery loaded into memory. Review it, then call dtDebug.commitRecovery() to save it to Firebase.';
    render();
    console.warn('[DT recovery] Loaded recovery copy into MEMORY ONLY. Nothing has been written to Firebase yet.');
    return {loaded:true,index,score:copy.score,names:copy.names};
  },
  async commitRecovery(){
    if(!_snapshotQuarantined) throw new Error('No recovery is staged.');
    const pushData={...state};
    delete pushData.activeTab;
    delete pushData.selectedCharacter;
    const dataStr=JSON.stringify(pushData);
    saveRecoveryCopy(dataStr,pushData,'manual-recovery-before-commit');
    await setDoc(doc(db,'campaigns',DOC),{data:dataStr});
    _lastAppliedRaw=dataStr;
    _lastRawSnapshot=dataStr;
    _lastParsedSnapshot=cloneJson(pushData);
    _snapshotQuarantined=false;
    _snapshotQuarantineReason='';
    setSyncDot('synced');
    console.info('[DT recovery] Recovery committed to Firebase.');
    return {committed:true,score:campaignDataScore(pushData)};
  }
};
let _firstSnapshotReceived = false;  // Firebase load-completed guard — see pushState
let _welcomeShown = false;
let _unsub = null;
let _presenceUnsub = null;
let _livePresenceIds = new Set([MY_PRESENCE_ID]);

function makeBlankSkills() {
  const o = {};
  SKILL_DEFS.forEach(s => { o[s.name] = { prof:false, expert:false, misc:0 }; });
  return o;
}

function blankChar(i) {
  return {
    id:`dt-${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
    name:'', codename:'', role:'', clearance:'', age:'', level:1, background:'',
    playerClass:'none',       // no class until DM assigns at level 10
    rank:'E',                 // letter rank E-S
    points:0,                 // gold currency
    title:'',                 // currently equipped title
    titles:[],                // titles unlocked by the Game Master
    exp:0,                    // current experience points
    systemLevel:1,            // system level (every 10 = 1 DnD level)
    division:'', site:'',
    profBonusOverride:null, initiativeBonus:0, attackStat:'STR',
    state: i<4?'active':'reserve',
    portrait:'', accentColor:'', claimedBy:'',
    // Base DnD stats — start at 8, player distributes 9 creation points
    stats:{STR:8,DEX:8,CON:8,INT:8,WIS:8,CHA:8},
    baseStatPoints:9,  // creation points remaining (out of 9)
    // System Stats — gain 3 distributable points per level
    // These ADD to the base DnD stats to form the effective score
    systemStats:{str:0,dex:0,con:0,int:0,wis:0,cha:0},
    skills:makeBlankSkills(),
    hp:{current:0,max:0}, mana:{current:0,max:0},
    armor:10, speed:'30 ft', tempHp:0,
    fatigue:0,  // 0-100, like Solo Leveling fatigue
    deathSaves:{successes:0,failures:0,stable:false},
    abilitiesText:'', notesText:'',
    relationships:[], weapons:[], inventory:[], anomalies:[], missions:[], abilities:[], commendations:[],
    discoveredSystemArchetypes:[], archetypeDiscountUses:0,
    skillStones:[],  // unabsorbed skill stones — absorbing moves them to abilities permanently
    personalSystem:{
      type:'none', name:'', description:'',
      chaos:{abilitySlots:1, equippedAbilityId:'', traits:[], items:[], skills:[], abilities:[]},
      quest:{smallQuests:[], requirementNotes:'', complexityLevel:1},
      training:{points:0, upgrades:[]}
    }
  };
}

let state = {
  characters: Array.from({length:6}, (_,i)=>blankChar(i)),
  selectedCharacter: 0,
  activeTab: 'status',
  showReserve: false,
  theme: null,
  shop: [],  // shared shop catalog managed by the DM
  titleCatalog: [], // GM-authored title definitions

  siteAlert: 'normal',                        // normal | lockdown | uncontained
  requests: []  // player item requests awaiting DM review
};

// Commendation/achievement catalog (DM grants these)
const COMMENDATIONS = [
  { id:'first_contain', icon:'◈', name:'First Kill',   desc:'Slew your first monster in the Tower.' },
  { id:'survived_keter', icon:'⚠', name:'Keter Survivor',     desc:'Survived direct contact with a Keter-class entity.' },
  { id:'tier4',         icon:'★', name:'Ascension',           desc:'Reached Tier IV — Overseer clearance.' },
  { id:'flawless',      icon:'✦', name:'Flawless Operation',  desc:'Completed a mission with no casualties or losses.' },
  { id:'scholar',       icon:'❖', name:'Field Scholar',       desc:'Documented 10+ anomalies in the log.' },
  { id:'big_game',      icon:'⬡', name:'Big Game',            desc:'Captured an A-grade or higher anomaly.' },
  { id:'sole_survivor', icon:'☩', name:'Sole Survivor',       desc:'The only agent to walk out of an operation.' },
  { id:'loyal',         icon:'⚒', name:'Tower Veteran',       desc:'Proven service in the Tower. Respected by all.' },
  { id:'sacrifice',     icon:'✝', name:'Ultimate Sacrifice',  desc:'Gave everything in the line of duty. (Posthumous)' }
];
const COMMENDATION_BY_ID = Object.fromEntries(COMMENDATIONS.map(c=>[c.id,c]));

// ================================================================
// HELPERS
// ================================================================
const el = id => document.getElementById(id);
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function mod(score){ return Math.floor((Number(score||10)-10)/2); }
function fmtMod(n){ return n>=0?`+${n}`:`${n}`; }
function profBonus(c){ if(c.profBonusOverride!=null) return Number(c.profBonusOverride)||0; return Math.ceil((Number(c.level)||1)/4)+1; }
function fmtGold(n){ return (Number(n)||0).toLocaleString('en-US'); }

function romanNumeral(n){
  const vals=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let x=Math.max(1,Math.floor(Number(n)||1)), out='';
  for(const [v,s] of vals){ while(x>=v){ out+=s; x-=v; } }
  return out;
}


function getChar(){
  if(dmUnlocked||spectator) return state.characters[state.selectedCharacter] || state.characters[0];
  const mine = state.characters.find(c=>c.claimedBy===MY_PRESENCE_ID);
  if(mine) return mine;
  return state.characters[state.selectedCharacter] || state.characters[0];
}
function getMyCharacter(){ return state.characters.find(c=>c.claimedBy===MY_PRESENCE_ID) || null; }
function rankOf(c){ return RANK_BY_ID[c.rank] || RANKS[0]; }

function titleDefByName(name){
  return (state.titleCatalog||[]).find(t=>t.name===name) || null;
}
function ensureCharacterTitles(c){
  if(!Array.isArray(c.titles)) c.titles=[];
  if(c.title && !c.titles.includes(c.title)) c.titles.push(c.title);
}


function ensureClamp(c){
  if(c.hp.max<0)c.hp.max=0;
  if(c.hp.current>c.hp.max)c.hp.current=c.hp.max;
  if(c.hp.current<0)c.hp.current=0;
  if(c.mana.max<0)c.mana.max=0;
  if(c.mana.current>c.mana.max)c.mana.current=c.mana.max;
  if(c.mana.current<0)c.mana.current=0;
  if(c.points<0)c.points=0;
  c.fatigue = clamp(c.fatigue || 0, 0, 100);
}

// System Stats → DnD stat mapping.
// Every 5 Status Points invested in one System Stat = +1 DnD ability point.
// Example: 4 STR status = +0 DnD STR, 5 = +1, 10 = +2, 13 = +2 (3/5 progress).
// The base DnD score still comes from character creation / point-buy.
const SYSTEM_STAT_MAP = {str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA'};
const SYSTEM_STAT_LABELS = {str:'Strength', dex:'Agility', con:'Vitality', int:'Intelligence', wis:'Sense', cha:'Charisma'};

const STATUS_POINTS_PER_DND_POINT = 5;
function systemStatDndBonus(raw){
  return Math.floor(Math.max(0,Number(raw)||0) / STATUS_POINTS_PER_DND_POINT);
}
function systemStatProgress(raw){
  const n=Math.max(0,Number(raw)||0);
  return {
    raw:n,
    bonus:systemStatDndBonus(n),
    progress:n % STATUS_POINTS_PER_DND_POINT,
    needed:STATUS_POINTS_PER_DND_POINT
  };
}

const SYSTEM_MILESTONE_BASE = 50;

const SYSTEM_MILESTONE_PASSIVES = {
  str:{
    name:'Titanic Force',
    icon:'✦',
    effect:t=>`+${t} melee damage. Carrying/lifting capacity is multiplied by ${1+t}.`,
    short:t=>`+${t} melee DMG`
  },
  dex:{
    name:'Predator Reflex',
    icon:'⚡',
    effect:t=>`+${t} Initiative and +${t*5} ft movement when the GM applies milestone movement bonuses.`,
    short:t=>`+${t} INIT`
  },
  con:{
    name:'Unbreakable Body',
    icon:'⬢',
    effect:t=>`Reduce physical damage taken by ${t} (GM adjudicated) and gain ${t*10} milestone Temp HP after a Full Rest.`,
    short:t=>`DR ${t} · ${t*10} Temp HP`
  },
  int:{
    name:'Mana Circuit',
    icon:'◆',
    effect:t=>`Gain ${t*5} additional milestone Mana capacity and +${t} to checks involving magical analysis.`,
    short:t=>`+${t*5} milestone MP`
  },
  wis:{
    name:"Hunter's Instinct",
    icon:'◉',
    effect:t=>`+${t*2} Passive Perception and +${t} to Mana Sense.`,
    short:t=>`+${t*2} Passive Perc.`
  },
  cha:{
    name:"King's Presence",
    icon:'♛',
    effect:t=>`+${t} to Charisma-based social checks when your title, authority or presence is relevant.`,
    short:t=>`+${t} social checks`
  }
};

function milestoneThresholdForTier(tier){
  if(tier<=0) return SYSTEM_MILESTONE_BASE;
  return SYSTEM_MILESTONE_BASE * Math.pow(2,tier-1);
}
function systemMilestoneTier(raw){
  const n=Math.max(0,Number(raw)||0);
  if(n < SYSTEM_MILESTONE_BASE) return 0;
  return Math.floor(Math.log2(n / SYSTEM_MILESTONE_BASE)) + 1;
}
function nextSystemMilestone(raw){
  const tier=systemMilestoneTier(raw);
  return milestoneThresholdForTier(tier+1);
}
function systemMilestoneInfo(key,raw){
  const tier=systemMilestoneTier(raw);
  const def=SYSTEM_MILESTONE_PASSIVES[key];
  return {
    key,
    raw:Math.max(0,Number(raw)||0),
    tier,
    current:tier ? milestoneThresholdForTier(tier) : 0,
    next:nextSystemMilestone(raw),
    name:def?.name||key,
    icon:def?.icon||'◆',
    effect:tier && def ? def.effect(tier) : 'No milestone passive unlocked yet.',
    short:tier && def ? def.short(tier) : 'LOCKED'
  };
}



function effectiveStat(c, stat) {
  const base = Number(c.stats[stat]) || 8;
  const sysKey = stat.toLowerCase();
  const sysRaw = Number(c.systemStats?.[sysKey]) || 0;
  const sysBonus = systemStatDndBonus(sysRaw);
  const cls = getClassDef(c.playerClass);
  const classBonus = Number(cls?.bonuses?.[stat]) || 0;
  return base + sysBonus + classBonus;
}

function getAllClasses() {
  const all = {};
  PLAYER_CLASSES.forEach(c => { all[c.id] = c; });
  try {
    if (Array.isArray(state?.customClasses)) {
      state.customClasses.forEach(c => { if(c && c.id) all[c.id] = c; });
    }
  } catch(e) { console.error('getAllClasses custom error:', e); }
  return all;
}
function getClassDef(id) { return getAllClasses()[id] || null; }

function calcSuggestedMaxHp(c) {
  const cls = getClassDef(c.playerClass);
  const hitDie = cls?.hitDie || 8;
  const conMod = mod(effectiveStat(c, 'CON'));
  const dndLvl = c.level || 1;
  const lvl1Hp = hitDie + conMod;
  const perLevel = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
  return Math.max(1, lvl1Hp + perLevel * (dndLvl - 1));
}

function calcSuggestedMaxMana(c) {
  const cls = getClassDef(c.playerClass);
  if (!cls) return 10;
  const manaStat = cls.primary === 'WIS' ? 'WIS' : cls.primary === 'CHA' ? 'CHA' : 'INT';
  const manamod = mod(effectiveStat(c, manaStat));
  const dndLvl = c.level || 1;
  return Math.max(0, 10 + (manamod * 2 + 3) * dndLvl);
}

// System stat points: 3 points per system level above 1.
// Lv.1 = 0pts, Lv.2 = 3pts, Lv.6 = 15pts, Lv.50 = 147pts, Lv.200 = 597pts.
function systemPointsTotal(c) {
  const sysLvl = Number(c.systemLevel) || 1;
  return Math.max(0, sysLvl - 1) * 3;
}
function systemPointsSpent(c) {
  const ss = c.systemStats || {};
  return Object.values(ss).reduce((sum, v) => sum + (Number(v) || 0), 0);
}
function systemPointsRemaining(c) { return Math.max(0, systemPointsTotal(c) - systemPointsSpent(c)); }

// ═════════════════════════════════════════════════════════════════
// EXP & LEVELING SYSTEM
// EXP needed scales ×1.8 per system level. Every 10 system levels = 1 DnD level.
// ═════════════════════════════════════════════════════════════════
const EXP_BASE = 100;    // EXP to go from system level 1 → 2
const EXP_SCALE = 1.05;  // ×1.05 per level — matches monster reward scaling across 200 levels

// EXP needed to go from level n to level n+1
// Each level takes roughly the same number of on-level fights (~8-15 kills)
// because monster EXP rewards scale at a similar rate to requirements.
// Levels 10-11 get a ×1.15 bump (class unlock wall — earns a grind moment).
function expForLevel(n) {
  let total = EXP_BASE;
  for (let i = 1; i < n; i++) {
    const scale = (i >= 10 && i <= 11) ? 1.15 : EXP_SCALE;
    total = Math.floor(total * scale);
  }
  return total;
}

// Total cumulative EXP needed to REACH level n (from level 1)
function expCumulativeForLevel(n) {
  let total = 0;
  for (let i = 1; i < n; i++) total += expForLevel(i);
  return total;
}

// EXP into current level (how much of the current level's bar is filled)
function expIntoCurrentLevel(c) {
  const cumNeeded = expCumulativeForLevel(c.systemLevel || 1);
  return Math.max(0, (c.exp || 0) - cumNeeded);
}

// EXP needed for the NEXT level up from current
function expNeededForNextLevel(c) { return expForLevel(c.systemLevel || 1); }

// DnD level derived from system level: every 10 system levels = 1 DnD level
function dndLevelFromSystem(sysLvl) { return Math.floor((Math.max(1, sysLvl) - 1) / 10) + 1; }

// Process EXP gain — auto level up, return number of levels gained
function gainExp(c, amount) {
  if (amount <= 0) return 0;
  c.exp = (c.exp || 0) + amount;
  let levelsGained = 0;
  const oldDndLevel = dndLevelFromSystem(c.systemLevel || 1);
  // Keep leveling up while we have enough EXP
  while (true) {
    const needed = expCumulativeForLevel((c.systemLevel || 1) + 1);
    if (c.exp >= needed) {
      c.systemLevel = (c.systemLevel || 1) + 1;
      levelsGained++;
    } else break;
  }
  // Sync DnD level
  c.level = dndLevelFromSystem(c.systemLevel);
  // Check if DnD level changed — announce rewards
  if (c.level > oldDndLevel) {
    for (let dLvl = oldDndLevel + 1; dLvl <= c.level; dLvl++) {
      announceDndLevelUp(c, dLvl);
    }
  }
  return levelsGained;
}

// DnD level-up benefits table
const DND_LEVEL_REWARDS = {
  1:  { profBonus:2, note:'Starting level.' },
  2:  { profBonus:2, note:'Gain a Hit Die. Class features improve.' },
  3:  { profBonus:2, note:'Gain a Hit Die. Subclass or archetype available.' },
  4:  { profBonus:2, note:'Gain a Hit Die. +2 to one Ability Score (or a Feat).' },
  5:  { profBonus:3, note:'Proficiency Bonus increases to +3. Gain a Hit Die. Extra Attack (martial).' },
  6:  { profBonus:3, note:'Gain a Hit Die. Class feature.' },
  7:  { profBonus:3, note:'Gain a Hit Die. Class feature.' },
  8:  { profBonus:3, note:'Gain a Hit Die. +2 to one Ability Score (or a Feat).' },
  9:  { profBonus:4, note:'Proficiency Bonus increases to +4. Gain a Hit Die. 5th-level spells (casters).' },
  10: { profBonus:4, note:'Gain a Hit Die. Class feature.' },
  11: { profBonus:4, note:'Gain a Hit Die. Class feature.' },
  12: { profBonus:4, note:'Gain a Hit Die. +2 to one Ability Score (or a Feat).' },
  13: { profBonus:5, note:'Proficiency Bonus increases to +5. Gain a Hit Die. 7th-level spells (casters).' },
  14: { profBonus:5, note:'Gain a Hit Die. Class feature.' },
  15: { profBonus:5, note:'Gain a Hit Die. Class feature.' },
  16: { profBonus:5, note:'Gain a Hit Die. +2 to one Ability Score (or a Feat).' },
  17: { profBonus:6, note:'Proficiency Bonus increases to +6. Gain a Hit Die. 9th-level spells (casters).' },
  18: { profBonus:6, note:'Gain a Hit Die. Class feature.' },
  19: { profBonus:6, note:'Gain a Hit Die. +2 to one Ability Score (or a Feat).' },
  20: { profBonus:6, note:'Gain a Hit Die. Capstone class feature. Maximum power.' }
};

function announceDndLevelUp(c, newDndLevel) {
  const reward = DND_LEVEL_REWARDS[newDndLevel] || {};
  const sysLvl = newDndLevel * 10;
  const isASI = [4,8,12,16,19].includes(newDndLevel);
  const isProfUp = [5,9,13,17].includes(newDndLevel);

  let msg = `⚔ DnD LEVEL UP! ${c.name||'Player'} is now DnD Level ${newDndLevel}!`;
  if (isProfUp) msg += ` Proficiency Bonus → +${reward.profBonus}.`;
  if (isASI) msg += ` Ability Score Improvement available!`;
  msg += ` ${reward.note || ''}`;

  showToast(msg, 'buy');

  // Auto-announce ASI availability (points are handled by totalBasePoints automatically)
  if (isASI) {
    showToast(`+2 Ability Score points available for ${c.name||'Player'}. Spend them in the Profile tab.`, 'info');
  }
}

// Base stat point-buy: starts with 9 points, gains +2 at DnD levels 4/8/12/16/19 (ASI).
// Total pool = baseStatPoints (default 9, DM can change) + (2 × number of ASI levels reached).
// Points spent = sum(stats) - 48 (6 stats × 8 base).
function totalBasePoints(c) {
  const dndLvl = c.level || 1;
  const asiLevels = [4,8,12,16,19].filter(l => dndLvl >= l).length;
  return (Number(c.baseStatPoints) || 9) + (asiLevels * 2);
}
function basePointsSpent(c) {
  return STATS.reduce((sum, s) => sum + (Number(c.stats[s]) || 8), 0) - 48;
}
function basePointsRemaining(c) { return Math.max(0, totalBasePoints(c) - basePointsSpent(c)); }

function normalize(raw){
  const m = { ...state, ...raw };

  // IMPORTANT: normalize incoming custom classes BEFORE validating character.playerClass.
  // Older builds validated against the local state's class catalog, which could reset a
  // perfectly valid Firebase custom class to "none" during initial load.
  if(!Array.isArray(m.customClasses)) m.customClasses = [];
  m.customClasses = m.customClasses
    .filter(cc=>cc && typeof cc==='object')
    .map((cc,ix)=>({
      ...cc,
      id:String(cc.id || ('custom_recovered_'+ix)),
      label:String(cc.label || cc.name || 'Custom Class'),
      icon:String(cc.icon || '✦'),
      color:String(cc.color || '#5aa8f5'),
      primary:STATS.includes(cc.primary) ? cc.primary : 'STR',
      desc:String(cc.desc || ''),
      bonuses:{...(cc.bonuses||{})},
      hitDie:Math.max(4,Number(cc.hitDie)||8),
      hidden:!!cc.hidden,
      custom:true,
      skills:Array.isArray(cc.skills) ? cc.skills.map(sk=>({...sk})) : []
    }));

  const incomingClassIds = new Set([
    'none',
    ...PLAYER_CLASSES.map(pc=>pc.id),
    ...m.customClasses.map(cc=>cc.id)
  ]);

  // Rehydrate custom starter skills into the runtime lookup table.
  m.customClasses.forEach(cc=>{
    if(Array.isArray(cc.skills) && cc.skills.length){
      CLASS_BASIC_SKILLS[cc.id] = cc.skills.map(sk=>({...sk}));
    }
  });

  if(!Array.isArray(m.characters)) m.characters = [];
  m.characters = m.characters.map((c,i)=>{
    try {
      const b = blankChar(i);
      const mc = { ...b, ...c };
      mc.stats = { ...b.stats, ...(c.stats||{}) };
      mc.hp = { ...b.hp, ...(c.hp||{}) };
      // Migrate mana → mana (backwards compat)
      mc.mana = { ...b.mana, ...(c.mana || c.sanity || {}) };
      mc.deathSaves = { ...b.deathSaves, ...(c.deathSaves||{}) };
      // System Stats — parallel stat pool that boosts DnD stats
      const bs = c.systemStats || {};
      mc.systemStats = {
        str: Math.max(0, Number(bs.str) || 0),
        dex: Math.max(0, Number(bs.dex) || 0),
        con: Math.max(0, Number(bs.con) || 0),
        int: Math.max(0, Number(bs.int) || 0),
        wis: Math.max(0, Number(bs.wis) || 0),
        cha: Math.max(0, Number(bs.cha) || 0)
      };
      mc.baseStatPoints = Math.max(0, Number(c.baseStatPoints ?? 9));
      // Preserve the class stored on the character whenever it exists in the
      // incoming campaign's built-in/custom class catalog. Unknown legacy IDs are
      // also preserved rather than destructively rewritten to "none".
      const incomingClass = String(c.playerClass || 'none');
      mc.playerClass = incomingClassIds.has(incomingClass) ? incomingClass : incomingClass;
      mc.title = String(c.title || '');
      mc.titles = Array.isArray(c.titles) ? [...new Set(c.titles.map(String).filter(Boolean))] : [];
      // Import old single-title saves into the owned-title list automatically.
      if(mc.title && !mc.titles.includes(mc.title)) mc.titles.push(mc.title);
      mc.exp = Math.max(0, Number(c.exp) || 0);
      mc.systemLevel = Math.max(1, Number(c.systemLevel) || 1);
      // DnD level is always derived from system level
      mc.level = dndLevelFromSystem(mc.systemLevel);
      mc.fatigue = clamp(Number(c.fatigue) || 0, 0, 100);
      if(!RANK_BY_ID[mc.rank]) mc.rank = 'E';      mc.relationships = Array.isArray(c.relationships)?c.relationships:[];
      mc.weapons    = Array.isArray(c.weapons)?c.weapons:[];
      mc.inventory  = Array.isArray(c.inventory)?c.inventory:[];
      mc.anomalies  = Array.isArray(c.anomalies)?c.anomalies:[];
      mc.missions   = Array.isArray(c.missions)?c.missions:[];
      // Damage-type arrays — resistances and vulnerabilities
      mc.resistances    = Array.isArray(c.resistances)    ? c.resistances.map(String)    : [];
      mc.vulnerabilities= Array.isArray(c.vulnerabilities)? c.vulnerabilities.map(String): [];
      mc.immunities     = Array.isArray(c.immunities)     ? c.immunities.map(String)     : [];
      mc.abilities  = (Array.isArray(c.abilities)?c.abilities:[]).map(a=>({
        name:a?.name||'', type:a?.type||'Talent', cost:a?.cost||'', cooldown:a?.cooldown||'', desc:a?.desc||'',
        source:a?.source||'', classId:a?.classId||'', locked:!!a?.locked, replaces:a?.replaces||''
      }));
      const ps = c.personalSystem || {};
      mc.personalSystem = {
        type:['none','chaos','quest','training'].includes(ps.type) ? ps.type : 'none',
        name:String(ps.name||''),
        description:String(ps.description||''),
        chaos:{
          // Chaos Gacha collection is unlimited, but only ONE Ability may be equipped.
          abilitySlots:1,
          equippedAbilityId:String(ps.chaos?.equippedAbilityId||''),
          traits:Array.isArray(ps.chaos?.traits)?ps.chaos.traits:[],
          items:Array.isArray(ps.chaos?.items)?ps.chaos.items:[],
          skills:Array.isArray(ps.chaos?.skills)?ps.chaos.skills:[],
          abilities:(Array.isArray(ps.chaos?.abilities)?ps.chaos.abilities:[]).map((a,i)=>{
            if(typeof a==='string') return {id:`chaos-legacy-${i}-${String(a).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,name:a,desc:''};
            return {...a,id:String(a?.id||`chaos-legacy-${i}-${String(a?.name||'ability').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`)};
          })
        },
        quest:{
          smallQuests:Array.isArray(ps.quest?.smallQuests)?ps.quest.smallQuests:[],
          requirementNotes:String(ps.quest?.requirementNotes||''),
          complexityLevel:Math.max(1,Number(ps.quest?.complexityLevel)||1)
        },
        training:{
          points:Math.max(0,Number(ps.training?.points)||0),
          upgrades:Array.isArray(ps.training?.upgrades)?ps.training.upgrades:[]
        }
      };
      mc.commendations = Array.isArray(c.commendations)?c.commendations:[];
      mc.discoveredSystemArchetypes = Array.isArray(c.discoveredSystemArchetypes) ? [...new Set(c.discoveredSystemArchetypes.map(String))] : [];
      mc.archetypeDiscountUses = Math.max(0, Number(c.archetypeDiscountUses)||0);
      mc.skillStones = (Array.isArray(c.skillStones)?c.skillStones:[]).map(s=>({
        id:       String(s?.id || ('ss-'+Date.now()+'-'+Math.random().toString(16).slice(2))),
        name:     String(s?.name || 'Unknown Skill'),
        type:     String(s?.type || 'Active'),
        cost:     String(s?.cost || '—'),
        cooldown: String(s?.cooldown || '—'),
        desc:     String(s?.desc || ''),
        element:  String(s?.element || ''),
        fromDm:   !!s?.fromDm,
        fromPlayer: String(s?.fromPlayer || '')
      }));
      if(typeof mc.points!=='number') mc.points = Number(mc.points)||0;
      if(!RANK_BY_ID[mc.rank]) mc.rank = 'E';
      const blankSk = makeBlankSkills(); mc.skills = {};
      Object.keys(blankSk).forEach(n=>{ mc.skills[n] = { ...blankSk[n], ...(c.skills?.[n]||{}) }; });
      return mc;
    } catch(err) {
      console.error(`Normalize failed for character ${i}, keeping raw:`, err, c);
      return c || blankChar(i);
    }
  });
  // Never force the roster back up to a fixed count — that re-spawned deleted agents.
  // Only guarantee at least one player file exists so the sheet can render.
  if(m.characters.length === 0) m.characters.push(blankChar(0));
  if(m.selectedCharacter>=m.characters.length) m.selectedCharacter = 0;
  if(!Array.isArray(m.shop)) m.shop = [];
  m.shop = m.shop.map(it=>({
    tier: Number(it.tier)||1,
    name: it.name||'',
    category: it.category||'Utility',
    price: Number(it.price)||0,
    stock: (it.stock===undefined?null:it.stock),
    desc: it.desc||'',
    icon: it.icon||'',
    rarity: it.rarity||'common',
    stats: it.stats||''
  }));
  // Evidence board
  // Site alert state
  if(!['normal','lockdown','uncontained'].includes(m.siteAlert)) m.siteAlert = 'normal';
  // Item requests
  if(!Array.isArray(m.requests)) m.requests = [];
  if(!Array.isArray(m.titleCatalog)) m.titleCatalog = [];
  m.titleCatalog = m.titleCatalog.map((t,ix)=>({
    id:String(t?.id || ('title-'+Date.now()+'-'+ix+'-'+Math.random().toString(16).slice(2,6))),
    name:String(t?.name || 'Untitled'),
    rarity:String(t?.rarity || 'common'),
    desc:String(t?.desc || ''),
    passive:String(t?.passive || ''),
    color:String(t?.color || '#77bfff')
  }));

  // Anomaly catalog — DM-authored master list. Each anomaly has an id
  // and a grantedTo:[charIds] array. Character sees it if their id is in there.
  if(!Array.isArray(m.anomalyCatalog)) m.anomalyCatalog = [];
  m.anomalyCatalog = m.anomalyCatalog.map((a,ix) => ({
    id:        String(a?.id ?? ('anom-'+Date.now()+'-'+ix+'-'+Math.random().toString(16).slice(2,5))),
    desig:     String(a?.desig ?? 'DT-???'),
    name:      String(a?.name ?? 'Unidentified'),
    threat:    THREAT_BY_GRADE[a?.threat] ? a.threat : 'F',
    class:     ANOMALY_CLASSES.includes(a?.class) ? a.class : 'Euclid',
    desc:      String(a?.desc ?? ''),
    redacted:  !!a?.redacted,   // DM classifies the description — players see █████
    grantedTo: Array.isArray(a?.grantedTo) ? a.grantedTo.map(String) : []
  }));

  // Investigation Cases — DM-authored, granted to specific agents
  if(!Array.isArray(m.cases)) m.cases = [];
  m.cases = m.cases.map((k,ix) => ({
    id:         String(k?.id ?? ('quest-'+Date.now()+'-'+ix+'-'+Math.random().toString(16).slice(2,5))),
    name:       String(k?.name ?? k?.title ?? 'Untitled Quest'),
    type:       ['main','side','daily','emergency','hunt'].includes(k?.type) ? k.type : 'side',
    rank:       RANK_BY_ID[k?.rank] ? k.rank : 'E',
    status:     ['available','active','completed','failed'].includes(k?.status) ? k.status : (k?.status==='open'?'active': k?.status==='closed'?'completed': 'available'),
    desc:       String(k?.desc ?? k?.briefing ?? ''),
    objectives: Array.isArray(k?.objectives) ? k.objectives.map(o => ({
      id: String(o?.id ?? ('obj-'+Math.random().toString(16).slice(2,6))),
      text: String(o?.text ?? ''),
      done: !!o?.done
    })) : [],
    rewards:    {
      exp:   Math.max(0, Number(k?.rewards?.exp) || 0),
      gold:  Math.max(0, Number(k?.rewards?.gold) || 0),
      items: Array.isArray(k?.rewards?.items) ? k.rewards.items.map(it=>{
        if(it && typeof it==='object') return {...it};
        return {name:String(it||''),qty:1};
      }).filter(it=>it.name) : []
    },
    assignedTo: k?.assignedTo === 'all' ? 'all' : (Array.isArray(k?.assignedTo) ? k.assignedTo.map(String) : (Array.isArray(k?.visibleTo) ? k.visibleTo : [])),
    timeLimit:  String(k?.timeLimit ?? ''),
    dmNotes:    String(k?.dmNotes ?? ''),
    completedBy: Array.isArray(k?.completedBy) ? k.completedBy.map(String) : [],
    created:    Number(k?.created) || Date.now()
  }));

  // Site Locator — investigation sites with atmosphere. One flagged as current scene.
  if(!Array.isArray(m.sites)) m.sites = [];
  m.sites = m.sites.map((s,ix) => ({
    id:         String(s?.id ?? ('site-'+Date.now()+'-'+ix+'-'+Math.random().toString(16).slice(2,5))),
    name:       String(s?.name ?? 'Unnamed Site'),
    designation:String(s?.designation ?? ''),
    region:     String(s?.region ?? 'urban'),
    description:String(s?.description ?? ''),
    atmosphere: String(s?.atmosphere ?? ''),
    contaminated: !!s?.contaminated,
    dmNotes:    String(s?.dmNotes ?? ''),
    current:    !!s?.current
  }));
  // Enforce single current site
  const cur = m.sites.filter(s => s.current).length;
  if (cur > 1) {
    let found = false;
    m.sites.forEach(s => { if (s.current) { if (found) s.current = false; else found = true; } });
  }

  // Initiative Tracker — combat encounter turn order (DM-managed)
  if(!m.initiative || typeof m.initiative !== 'object') m.initiative = { active:false, round:1, turnIdx:0, entries:[] };
  m.initiative.active = !!m.initiative.active;
  m.initiative.round  = Math.max(1, Number(m.initiative.round) || 1);
  m.initiative.turnIdx = Math.max(0, Number(m.initiative.turnIdx) || 0);
  m.initiative.entries = Array.isArray(m.initiative.entries) ? m.initiative.entries.map((e,ix) => ({
    id:    String(e?.id ?? ('init-'+Date.now()+'-'+ix)),
    name:  String(e?.name ?? '—'),
    init:  Number(e?.init) || 0,
    hp:    e?.hp === undefined ? null : Number(e.hp),
    hpMax: e?.hpMax === undefined ? null : Number(e.hpMax),
    hostile: !!e?.hostile,
    kind:  ['agent','anomaly','npc'].includes(e?.kind) ? e.kind : 'npc'
  })) : [];

  return m;
}

// ================================================================
// CALCULATIONS
// ================================================================
function passivePerception(c){
  const tier=systemMilestoneTier(c.systemStats?.wis);
  return 10 + skillTotal(c,'Perception') + (tier*2);
}
function archetypeSkillBonus(c, skillName){
  const found=new Set(Array.isArray(c?.discoveredSystemArchetypes)?c.discoveredSystemArchetypes:[]);
  const count=SYSTEM_ARCHETYPES.filter(a=>found.has(a.id) && a.skill===skillName).length;
  return Math.min(3,count);
}
function archetypeById(id){ return SYSTEM_ARCHETYPES.find(a=>a.id===id)||null; }
function skillTotal(c, skillName){
  const def = SKILL_DEFS.find(s=>s.name===skillName);
  if(!def) return 0;
  const sk = c.skills?.[skillName] || {prof:false,expert:false,misc:0};
  let total = mod(effectiveStat(c, def.stat));
  const pb = profBonus(c);
  if(sk.expert) total += pb*2;
  else if(sk.prof) total += pb;
  total += Number(sk.misc)||0;
  total += archetypeSkillBonus(c, skillName);
  return total;
}
function calcInitiative(c){
  const tier=systemMilestoneTier(c.systemStats?.dex);
  return mod(effectiveStat(c, 'DEX')) + (Number(c.initiativeBonus)||0) + tier;
}
function attackBonus(c){ return mod(effectiveStat(c, c.attackStat||'STR')) + profBonus(c); }

// ================================================================
// FIREBASE SYNC
// ================================================================
function setSyncDot(s){
  const d = el('syncDot');
  if(d){
    d.className = 'sync-dot '+s;
    d.title = {synced:'Synced',syncing:'Syncing…',error:'Offline — changes may not save',warn:'Waiting for Firebase — writes paused for safety'}[s]||s;
  }
  const cd = el('connectionDot');
  const label = el('connectionLabel');
  if(cd) cd.className = 'command-dot '+s;
  if(label) label.textContent = ({synced:'ONLINE',syncing:'SYNCING',error:'OFFLINE',warn:'WAITING'})[s] || String(s||'').toUpperCase();
}

let _pushDebounce = null;
// Tracks the exact optimistic local state currently being written.
// This prevents an older Firestore snapshot from erasing a Skill/Trait/Ability
// in the tiny window between clicking ADD and Firebase acknowledging the write.
let _pendingLocalWriteRaw = '';
let _pendingLocalWriteSince = 0;

async function pushState(immediate=false){
  if(spectator) return;
  if(_snapshotQuarantined){
    console.warn('pushState blocked: suspicious snapshot/recovery quarantine is active.', _snapshotQuarantineReason);
    setSyncDot('warn');
    return;
  }
  // ────────────────────────────────────────────────────────────
  // CRITICAL SAFETY: never push local state to Firebase until we
  // have successfully RECEIVED at least one snapshot from Firebase.
  // Without this guard, if the initial load fails silently, the
  // default empty state would overwrite the real data on first
  // interaction. This is what caused "everything is gone" issues.
  // ────────────────────────────────────────────────────────────
  if(!_firstSnapshotReceived){
    console.warn('pushState blocked: no Firebase snapshot received yet. Will retry after load.');
    setSyncDot('warn');
    return;
  }
  // Guard: don't push completely empty state (no names AND no shop).
  // But DO allow pushing if there are system-level changes (EXP, gold, etc.)
  // Strip local-only fields that should NOT sync across clients.
  // Each player navigates their own tabs and selects their own character.
  const pushData = { ...state };
  delete pushData.activeTab;
  delete pushData.selectedCharacter;
  const dataStr = JSON.stringify(pushData);
  _pendingLocalWriteRaw = dataStr;
  _pendingLocalWriteSince = Date.now();

  // Rolling local backup of every meaningful outgoing state BEFORE Firebase write.
  // Blank/default states are deliberately not promoted as good recovery points.
  if(!isSuspiciousBlankCampaign(pushData)) saveRecoveryCopy(dataStr, pushData, 'before-write');

  // Size guard — Firestore doc limit ~1MB
  if(dataStr.length > 900000){
    console.error('pushState: data too large!', (dataStr.length/1024).toFixed(0)+'KB');
    showToast('⚠ Save data very large. Clear old quests/shop items.','warn');
  }
  if(immediate){
    setSyncDot('syncing');
    try { await setDoc(doc(db,'campaigns',DOC), { data: dataStr }); setSyncDot('synced'); }
    catch(e){ console.error(e); setSyncDot('error'); }
    return;
  }
  setSyncDot('syncing');
  clearTimeout(_pushDebounce);
  _pushDebounce = setTimeout(async ()=>{
    try { await setDoc(doc(db,'campaigns',DOC), { data: dataStr }); setSyncDot('synced'); }
    catch(e){ console.error(e); setSyncDot('error'); }
  }, 600);
}
// Force any pending debounced write to go out right now (e.g. on blur / before unload).
function flushPendingPush(){
  if(_pushDebounce){ clearTimeout(_pushDebounce); _pushDebounce=null; pushState(true); }
}

function startListener(){
  if(_unsub) _unsub();
  _unsub = onSnapshot(doc(db,'campaigns',DOC), snap=>{
    if(!snap.exists()){
      // Doc doesn't exist — first-time campaign. Unlock pushes so the
      // initial character setup can go into Firebase.
      _firstSnapshotReceived = true;
      setSyncDot('synced');
      return;
    }
    try {
      const raw = snap.data().data;

      // SAVE-RACE GUARD:
      // When the user just clicked ADD/SAVE, the UI already contains the new data.
      // Firestore can briefly emit an older snapshot before the write acknowledgement.
      // Never let that stale snapshot overwrite the optimistic local edit.
      if(_pendingLocalWriteRaw){
        if(raw===_pendingLocalWriteRaw){
          _pendingLocalWriteRaw='';
          _pendingLocalWriteSince=0;
        }else if(Date.now()-_pendingLocalWriteSince < 10000){
          console.debug('[DT sync] stale snapshot ignored while local write is pending');
          _firstSnapshotReceived = true;
          setSyncDot('syncing');
          return;
        }else{
          // Safety release if a write never receives an acknowledgement.
          _pendingLocalWriteRaw='';
          _pendingLocalWriteSince=0;
        }
      }

      if(raw===_lastAppliedRaw){ setSyncDot('synced'); _firstSnapshotReceived = true; return; }
      _lastAppliedRaw = raw;

      // Preserve the exact Firebase payload BEFORE normalize() touches it.
      const parsedRaw = JSON.parse(raw);
      _lastRawSnapshot = raw;
      _lastParsedSnapshot = cloneJson(parsedRaw);

      // Save every meaningful raw snapshot as a rolling local recovery point.
      // We also keep suspicious snapshots for forensic inspection, but they do
      // not replace a richer local/recovery state automatically.
      saveRecoveryCopy(raw, parsedRaw, 'firebase-raw');

      const incomingSuspicious = isSuspiciousBlankCampaign(parsedRaw);
      const incomingScore = campaignDataScore(parsedRaw);
      const currentScore = campaignDataScore(state);
      const best = bestRecoveryCopy();
      const bestScore = Number(best?.score)||0;

      if(incomingSuspicious && Math.max(currentScore,bestScore) > incomingScore + 5){
        _snapshotQuarantined = true;
        _snapshotQuarantineReason =
          `Suspicious blank Firebase snapshot blocked (remote score ${incomingScore}; local/recovery score ${Math.max(currentScore,bestScore)}).`;
        _firstSnapshotReceived = true;
        setSyncDot('warn');
        console.error('[DT recovery] '+_snapshotQuarantineReason);
        console.info('[DT recovery] Inspect with dtDebug.rawSnapshot() and dtDebug.recoveryStatus().');
        if(best && bestScore > currentScore){
          try{
            state = normalize(JSON.parse(best.raw));
            console.warn('[DT recovery] Displaying the strongest LOCAL recovery copy in memory. Firebase was NOT overwritten.');
          }catch(e){ console.error('[DT recovery] Could not load local recovery copy:',e); }
        }
        render();
        return;
      }

      _snapshotQuarantined = false;
      _snapshotQuarantineReason = '';
      const remote = normalize(parsedRaw);

      const ae = document.activeElement;
      const isTyping = ae && (ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.tagName==='SELECT');
      const myIdx = state.characters.findIndex(c=>c.claimedBy===MY_PRESENCE_ID);

      remote.characters.forEach((rc,i)=>{
        if(isTyping && i===(myIdx>=0?myIdx:state.selectedCharacter)) return;
        state.characters[i] = rc;
      });
      // Match the remote roster length exactly — grow if added, shrink if deleted.
      if(state.characters.length > remote.characters.length){
        state.characters.length = remote.characters.length;
      } else {
        while(state.characters.length < remote.characters.length)
          state.characters.push(remote.characters[state.characters.length]);
      }
      if(state.selectedCharacter >= state.characters.length) state.selectedCharacter = 0;
      if(Array.isArray(remote.shop)) state.shop = remote.shop;
      if(Array.isArray(remote.requests)) state.requests = remote.requests;
      if(Array.isArray(remote.customClasses)) state.customClasses = remote.customClasses;
      state.theme = remote.theme;
      state.anomalyCatalog = remote.anomalyCatalog || [];
      state.cases         = remote.cases         || [];
      state.sites         = remote.sites         || [];
      state.initiative    = remote.initiative    || { active:false, round:1, turnIdx:0, entries:[] };
      state.sceneName     = remote.sceneName     || '';
      state.broadcast     = remote.broadcast     || '';
      // DO NOT sync activeTab or selectedCharacter — those are local per-client
      const prevAlert = state.siteAlert;
      state.siteAlert = remote.siteAlert;
      _firstSnapshotReceived = true;   // Firebase data safely loaded — writes are now safe

      // ── Stale-claim reconciliation ────────────────────────
      if ((spectator || dmUnlocked) && !_claimReconciled) {
        _claimReconciled = true;
        const held = state.characters.some(c => c.claimedBy === MY_PRESENCE_ID);
        if (held) {
          releaseMyClaim(true);
          console.log('[dt] released stale character claim (watcher/DM mode)');
        }
      }

      setSyncDot('synced');

      if(isTyping){
        try{ renderCharacterTabs(); }catch(e){}
        recheckWelcomeIfNeeded();
        if(!el('welcomeOverlay') && !_welcomeShown){ _welcomeShown=true; checkWelcome(); }
        return;
      }
      render();
      if(spectator) disableAllInputs();
      recheckWelcomeIfNeeded();
      if(!el('welcomeOverlay') && !_welcomeShown){ _welcomeShown=true; checkWelcome(); }
    } catch(e){
      console.error('Snapshot error — Firebase load failed:', e);
      setSyncDot('error');
      // Do NOT flip _firstSnapshotReceived — writes stay blocked so
      // we can't overwrite Firebase with local defaults.
    }
  }, e=>{ console.error(e); setSyncDot('error'); });
}

// ── PRESENCE ──
async function pushPresence(){
  if(!getMyCharacter() && !dmUnlocked && !spectator) {
    // still register a faceless presence so the DM sees observers
  }
  try {
    const mine = getMyCharacter();
    const name = dmUnlocked ? 'DM' : (mine?.name || (spectator?'Observer':'Anon'));
    const color = mine?.accentColor || (dmUnlocked?'#d94f4f':'#7a8590');
    await setDoc(doc(db,'dt-presence',MY_PRESENCE_ID), { id:MY_PRESENCE_ID, name, color, ts:Date.now() });
  } catch(e){}
}
function startPresenceListener(){
  if(_presenceUnsub) _presenceUnsub();
  _presenceUnsub = onSnapshot(collection(db,'dt-presence'), snap=>{
    const now = Date.now(); const active=[]; const liveIds=new Set();
    snap.forEach(d=>{
      const p = d.data();
      if(now-p.ts<35000){ active.push(p); liveIds.add(p.id); }
      else { deleteDoc(doc(db,'dt-presence',d.id)).catch(()=>{}); }
    });
    liveIds.add(MY_PRESENCE_ID);
    _livePresenceIds = liveIds;
    renderPresence(active);
    try{ refreshWelcomeTaken(); }catch(e){}
    try{ renderCharacterTabs(); }catch(e){}
  }, ()=>{});
}
function renderPresence(players){
  const bar = el('presenceBar'); if(!bar) return;
  if(!players.length){ bar.innerHTML=''; return; }
  bar.innerHTML = players.map(p=>`<div class="presence-dot" style="border-color:${p.color};box-shadow:0 0 8px ${p.color}55" title="${esc(p.name)}"><span style="background:${p.color}"></span>${esc((p.name||'?').split(' ')[0])}</div>`).join('');
}
function isTakenByLiveOther(c){ return !!c.claimedBy && c.claimedBy!==MY_PRESENCE_ID && _livePresenceIds.has(c.claimedBy); }
setInterval(pushPresence, 20000);

// ── RELEASE CHARACTER ON LEAVE ──
// When this person leaves the site, free up whatever character they claimed
// so it isn't hard-locked for the next session / another player.
function releaseMyCharacterSync(){
  try {
    // Make sure any pending debounced edit is included in what we beacon out.
    if(_pushDebounce){ clearTimeout(_pushDebounce); _pushDebounce=null; }
    const mine = state.characters.find(c=>c.claimedBy===MY_PRESENCE_ID);
    if(!mine) { // still drop presence
      navigator.sendBeacon && _beaconDelete('dt-presence', MY_PRESENCE_ID);
      return;
    }
    mine.claimedBy = '';
    // Write the freed state + remove presence using sendBeacon so it survives unload.
    _beaconSetCampaign();
    _beaconDelete('dt-presence', MY_PRESENCE_ID);
  } catch(e){}
}
// Firestore REST beacon helpers (regular setDoc won't reliably finish during unload)
function _fbProjectUrl(path){
  return `https://firestore.googleapis.com/v1/projects/${FB_CONFIG.projectId}/databases/(default)/documents/${path}`;
}
function _beaconDelete(coll, id){
  // best-effort; presence also self-expires after 35s if this fails
  try { fetch(_fbProjectUrl(`${coll}/${id}`), { method:'DELETE', keepalive:true }).catch(()=>{}); } catch(e){}
}
function _beaconSetCampaign(){
  try {
    const body = JSON.stringify({ fields: { data: { stringValue: JSON.stringify(state) } } });
    fetch(_fbProjectUrl(`campaigns/${DOC}`) + `?updateMask.fieldPaths=data`, {
      method:'PATCH', keepalive:true, headers:{'Content-Type':'application/json'}, body
    }).catch(()=>{});
  } catch(e){}
}
function releaseMyCharacter(){
  // Used for explicit "release" actions while the page is alive (normal setDoc path).
  const mine = state.characters.find(c=>c.claimedBy===MY_PRESENCE_ID);
  if(!mine) return;
  mine.claimedBy = '';
  localStorage.removeItem('dt-my-idx');
  pushState(true); pushPresence(); render();
}
window.addEventListener('pagehide', releaseMyCharacterSync);
window.addEventListener('beforeunload', releaseMyCharacterSync);
// When the tab is hidden (switched away / about to close), flush pending edits — this is
// the most reliable save hook on mobile, where unload events often don't fire.
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden'){ if(_pushDebounce){ clearTimeout(_pushDebounce); _pushDebounce=null; } _beaconSetCampaign(); } });

// ================================================================
// RENDER ENGINE
// ================================================================
function render(){
  try{ renderCharacterTabs(); }catch(e){ console.error('tabs',e); }
  try{ renderHeader(); }catch(e){ console.error('header',e); }
  try{ renderMainFields(); }catch(e){ console.error('fields',e); }
  try{ renderStats(); }catch(e){ console.error('stats',e); }
  try{ renderStatusWindow(); }catch(e){ console.error('statusWindow',e); }
  try{ renderDamageTypes(); }catch(e){ console.error('damageTypes',e); }
  try{ renderQuestLog(); }catch(e){}
  try{ renderSkillsMatrix(); }catch(e){ console.error('skills',e); }
  try{ renderCalcPanel(); }catch(e){ console.error('calc',e); }
  try{ renderRankBadge(); }catch(e){}
  try{ renderRelationships(); }catch(e){}
  try{ renderWeapons(); }catch(e){}
  try{ renderInventory(); }catch(e){}

  try{ renderAbilities(); }catch(e){}
  try{ renderShop(); }catch(e){}


  try{ renderDeathSaves(); }catch(e){}
  try{ renderDmPanel(); }catch(e){ console.error('renderDmPanel error:', e); }
  try{ applyCharacterAccents(); }catch(e){}
  try{ renderIdentityBar(); }catch(e){}
  try{ applyManaDamage(); }catch(e){}
  try{ applyHeartbeat(); }catch(e){}
  try{ updateAmbient(); }catch(e){}
  try{ renderTabs(); }catch(e){}
  try{ pushPresence(); }catch(e){}
  if(spectator) disableAllInputs();
}

function renderTabs(){
  const c = getChar();
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===state.activeTab);
    // Add badges
    const old = b.querySelector('.tab-badge');
    if(old) old.remove();
    if(b.dataset.tab === 'cases'){
      const activeQuests = (state.cases||[]).filter(q=>q.status==='active').length;
      if(activeQuests > 0) b.insertAdjacentHTML('beforeend', `<span class="tab-badge">${activeQuests}</span>`);
    }
    if(b.dataset.tab === 'abilities' && c){
      const stones = (c.skillStones||[]).length;
      if(stones > 0) b.insertAdjacentHTML('beforeend', `<span class="tab-badge stones">${stones}</span>`);
    }
  });
  document.querySelectorAll('.tab-content[data-tab]').forEach(t=>t.classList.toggle('active', t.dataset.tab===state.activeTab));
  try {
    switch(state.activeTab){
      case 'profile':   renderMainFields(); renderStats(); renderDamageTypes(); renderCalcPanel(); renderDeathSaves(); renderRankBadge(); break;
      case 'status':    renderStatusWindow(); break;
      case 'skills':    renderSkillsMatrix(); break;
      case 'loadout':   renderWeapons(); renderInventory(); break;
      case 'relations': renderPartyOverview(); renderRelationships(); break;
      case 'notes': break;
      case 'cases':     renderQuestLog(); break;
      case 'abilities': renderAbilities(); renderSkillStones(); break;
      case 'shop':      renderShop(); break;
      case 'system':    renderPersonalSystem(); break;
    }
  } catch(e){}
}

function renderCharacterTabs(){
  const tabs = el('characterTabs'); if(!tabs) return; tabs.innerHTML='';
  state.characters.forEach((c,i)=>{
    if(c.state==='reserve' && !state.showReserve && !dmUnlocked) return;
    const isSel = i===state.selectedCharacter;
    const isOwn = c.claimedBy===MY_PRESENCE_ID;
    const taken = isTakenByLiveOther(c);
    const rk = rankOf(c);
    const cls = getClassDef(c.playerClass);
    const btn = document.createElement('button'); btn.type='button';
    btn.className = `character-tab${c.state==='reserve'?' reserve':''}${c.state==='dead'?' dead':''}${isSel?' active':''}${isOwn?' owned':''}`;
    btn.style.setProperty('--char-color', rk.color);
    const hpPct = c.hp.max>0?clamp(c.hp.current/c.hp.max*100,0,100):0;
    const mpPct = c.mana.max>0?clamp(c.mana.current/c.mana.max*100,0,100):0;
    const expPct = expNeededForNextLevel(c)>0?clamp(expIntoCurrentLevel(c)/expNeededForNextLevel(c)*100,0,100):0;
    const hpColor = hpPct>50?'#5a9a78':hpPct>25?'#c2a23a':'#d94f4f';
    btn.innerHTML = `
      <div class="ctab-top">
        <span class="ctab-rank" style="color:${rk.color}">${rk.id}</span>
        <span class="ctab-name">${esc(c.name||`Player ${i+1}`)}</span>
        ${isOwn?'<span class="ctab-badge you">YOU</span>':taken?'<span class="ctab-badge taken">●</span>':''}
      </div>
      <div class="ctab-info">
        <span class="ctab-class">${cls ? `${cls.icon}` : '—'}</span>
        <span class="ctab-lvl">Lv.${c.systemLevel||1}</span>
      </div>
      <div class="ctab-bars">
        <div class="ctab-bar hp"><div class="ctab-bar-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
        <div class="ctab-bar mp"><div class="ctab-bar-fill" style="width:${mpPct}%;background:#4a8bf5"></div></div>
        <div class="ctab-bar exp"><div class="ctab-bar-fill" style="width:${expPct}%;background:#4ade80"></div></div>
      </div>`;
    if(dmUnlocked||spectator){
      btn.addEventListener('click', ()=>{ state.selectedCharacter=i; render(); });
    } else if(taken){
      btn.disabled = true;
      btn.classList.add('locked-tab');
      btn.title = `${c.name||'This character'} is currently in use`;
    } else {
      btn.classList.add('selectable-tab');
      btn.title = isOwn ? 'Your current character' : `Switch to ${c.name||`Player ${i+1}`}`;
      btn.addEventListener('click', ()=>{
        if(isOwn){ state.selectedCharacter=i; render(); return; }
        claimCharacter(i);
        showToast(`Switched to ${c.name||`Player ${i+1}`}`,'buy');
      });
    }
    tabs.appendChild(btn);
  });
}

function renderHeader(){
  const c = getChar();
  const s = (id,v)=>{ const e=el(id); if(e) e.textContent=v; };
  const rk = rankOf(c);
  const cls = getClassDef(c.playerClass);
  s('topPlayerName', c.name||'—');
  s('topPlayerRole', cls ? `${cls.icon} ${cls.label}` : 'No Class');
  s('topRank', `${rk.title} · Sys.Lv.${c.systemLevel||1}`);
  s('topGold', fmtGold(c.points));
  s('topHpMini', `${c.hp.current} / ${c.hp.max}`);
  s('topManaMini', `${c.mana.current} / ${c.mana.max}`);
  s('topArmorMini', c.armor);
  try { renderDmTargetPicker(); } catch(e){}
  const hpPct = c.hp.max>0?(c.hp.current/c.hp.max)*100:0;
  const sPct  = c.mana.max>0?(c.mana.current/c.mana.max)*100:0;
  const hb=el('topHpBar'); if(hb) hb.style.width=clamp(hpPct,0,100)+'%';
  const sb=el('topManaBar'); if(sb) sb.style.width=clamp(sPct,0,100)+'%';
  const rb=el('topRankBadge'); if(rb){ rb.textContent=rk.id; rb.style.color=rk.color; rb.style.borderColor=rk.color; }
}

function renderRankBadge(){
  const c = getChar();
  const rk = rankOf(c);
  const host = el('rankDisplay'); if(!host) return;
  host.innerHTML = RANKS.map(r=>`
    <div class="rank-pip ${r.id===c.rank?'active':''}" style="--rk:${r.color}">
      <span class="rank-pip-id">${r.id}</span>
      <span class="rank-pip-title">${r.title}</span>
    </div>`).join('');
}

// ── MAIN FIELDS ──
function renderMainFields(){
  const c = getChar();
  // Skip if user is actively typing in one of our fields
  const ae = document.activeElement;
  const isTypingHere = ae && ae.closest && ae.closest('.profile-grid');
  const sv = (id,v)=>{ const e=el(id); if(e && document.activeElement!==e) e.value=(v==null?'':v); };
  sv('charName',c.name); sv('charCodename',c.title || c.codename);
  sv('charAge',c.age); sv('charLevel',c.level);
  sv('charBackground',c.background);
  sv('charSpeed',c.speed); sv('charArmor',c.armor); sv('charTempHp',c.tempHp);
  sv('currentHp',c.hp.current); sv('maxHp',c.hp.max);
  sv('currentMana',c.mana.current); sv('maxMana',c.mana.max);
  // Show suggested HP/MP based on class + CON/INT
  const sugHp = el('suggestedHp');
  if(sugHp) sugHp.textContent = `Suggested: ${calcSuggestedMaxHp(c)}`;
  const sugMp = el('suggestedMp');
  if(sugMp) sugMp.textContent = `Suggested: ${calcSuggestedMaxMana(c)}`;
  const initDisp = el('initiativeDisplay'); if(initDisp) initDisp.value = fmtMod(calcInitiative(c));
  const pp = el('passivePerc'); if(pp) pp.textContent = passivePerception(c);
  // portrait
  const slot = el('portraitSlot');
  if(slot){
    if(c.portrait) slot.style.setProperty('--portrait-url', `url("${c.portrait}")`);
    else slot.style.removeProperty('--portrait-url');
    slot.classList.toggle('has-img', !!c.portrait);
  }
  // Notes textarea
  const notes = el('notesArea');
  if(notes && document.activeElement !== notes) notes.value = c.notesText || '';

  // Class display — read-only, DM assigns at system level 10
  const classDisplay = el('charClassDisplay');
  if(classDisplay){
    const cls = getClassDef(c.playerClass);
    const sysLvl = Number(c.systemLevel) || 1;
    if(cls){
      classDisplay.value = `${cls.icon} ${cls.label}`;
      classDisplay.style.color = cls.color;
    } else {
      classDisplay.value = sysLvl >= 10 ? 'Awaiting assignment (DM)' : `Unlocks at Sys.Lv.10 (currently ${sysLvl})`;
      classDisplay.style.color = '';
    }
  }
  // Rank dropdown
  const rkSel = el('charClearance'); if(rkSel && document.activeElement!==rkSel) rkSel.value = c.rank;
  // state radios
  ['Active','Reserve','Dead'].forEach(st=>{
    const r = el('state'+st); if(r) r.checked = c.state===st.toLowerCase();
  });
}

// ── DAMAGE TYPES — click to cycle: none → resist → vulnerable → immune ──
function renderDamageTypes(){
  const c = getChar();
  const host = el('damageTypesGrid'); if(!host) return;

  host.innerHTML = DAMAGE_TYPES.map(t => {
    let stateCls = 'none';
    if ((c.immunities||[]).includes(t.id))          stateCls = 'imm';
    else if ((c.resistances||[]).includes(t.id))    stateCls = 'res';
    else if ((c.vulnerabilities||[]).includes(t.id)) stateCls = 'vuln';
    return `<button type="button" class="dt-cell dt-${stateCls}" data-dt="${t.id}"
      data-tt="${esc(t.desc)} · Click to cycle: neutral → resist → vulnerable → immune → neutral">
      <span class="dt-icon">${t.icon}</span>
      <span class="dt-name">${t.label}</span>
      <span class="dt-badge">${stateCls==='res'?'RES':stateCls==='vuln'?'VUL':stateCls==='imm'?'IMM':''}</span>
    </button>`;
  }).join('');

  host.querySelectorAll('[data-dt]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.dt;
    let cur = 'none';
    if ((c.immunities||[]).includes(id))          cur = 'imm';
    else if ((c.resistances||[]).includes(id))    cur = 'res';
    else if ((c.vulnerabilities||[]).includes(id)) cur = 'vuln';
    c.resistances     = (c.resistances||[]).filter(x => x !== id);
    c.vulnerabilities = (c.vulnerabilities||[]).filter(x => x !== id);
    c.immunities      = (c.immunities||[]).filter(x => x !== id);
    const next = { none:'res', res:'vuln', vuln:'imm', imm:'none' }[cur];
    if (next === 'res')  c.resistances.push(id);
    if (next === 'vuln') c.vulnerabilities.push(id);
    if (next === 'imm')  c.immunities.push(id);
    pushState(true); renderDamageTypes();
  }));
}

// ── STATS ──
function renderStats(){
  const c = getChar();
  const grid = el('statsGrid'); if(!grid) return;
  grid.innerHTML = STATS.map(st=>{
    const base = Number(c.stats[st]) || 8;
    const sysKey = st.toLowerCase();
    const sysRaw = Number(c.systemStats?.[sysKey]) || 0;
    const sysBonus = systemStatDndBonus(sysRaw);
    const cls = getClassDef(c.playerClass);
    const classBonus = Number(cls?.bonuses?.[st]) || 0;
    const effective = base + sysBonus + classBonus;
    const m = mod(effective);
    const modPos = m > 0;
    const modZero = m === 0;
    const bonusParts = [];
    if(sysBonus) bonusParts.push(`+${sysBonus} sys (${sysRaw}/3)`);
    if(classBonus) bonusParts.push(`+${classBonus} class`);
    return `
    <div class="stat-block ${modPos?'positive':''} ${modZero?'neutral':''}">
      <div class="stat-header">
        <span class="stat-key">${st}</span>
        <span class="stat-sub">${STAT_LABELS[st]}</span>
      </div>
      <div class="stat-mod-display">
        <span class="stat-mod-sign">${modPos?'+':m<0?'−':'±'}</span>
        <span class="stat-mod-val">${Math.abs(m)}</span>
      </div>
      <div class="stat-score-row">
        <button class="stat-adj minus" data-stat="${st}" data-action="minus" title="Decrease base">−</button>
        <input class="stat-score" id="stat_${st}" type="number" value="${base}" data-stat="${st}" aria-label="${st} base score">
        <button class="stat-adj plus" data-stat="${st}" data-action="plus" title="Increase base">+</button>
      </div>
      ${bonusParts.length ? `<div class="stat-sys-bonus">${bonusParts.join(' ')}</div>` : ''}
      <div class="stat-effective">= ${effective}</div>
      <div class="stat-corner tl"></div>
      <div class="stat-corner br"></div>
    </div>`;
  }).join('');
  // Base creation points remaining
  const bpr = basePointsRemaining(c);
  const bprEl = el('basePointsRemaining');
  if (bprEl) bprEl.textContent = `${bpr} / ${totalBasePoints(c)}`;

  grid.querySelectorAll('.stat-score').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const newVal = Number(e.target.value) || 8;
      c.stats[e.target.dataset.stat] = newVal;
      pushState(); renderStats(); renderSkillsMatrix(); renderCalcPanel(); renderHeader();
      renderStatusWindow();
    });
  });
  grid.querySelectorAll('.stat-adj').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const st=btn.dataset.stat;
      const dir = btn.dataset.action==='plus' ? 1 : -1;
      // If increasing, check base point budget
      if (dir > 0 && basePointsRemaining(c) <= 0) return;
      const newVal = (Number(c.stats[st])||8) + dir;
      if (newVal < 1) return;
      c.stats[st] = newVal;
      pushState(); renderStats(); renderSkillsMatrix(); renderCalcPanel(); renderHeader();
      renderStatusWindow();
    });
  });
}

// ═════════════════════════════════════════════════════════════════
// STATUS WINDOW — Solo Leveling system panel
// Shows the character's System Stats with point allocation,
// HP/MP bars, class, title, fatigue, and remaining points.
// ═════════════════════════════════════════════════════════════════
function renderStatusWindow(){
  const host = el('statusWindow'); if(!host) return;
  const c = getChar();
  if(!c || !c.stats) { host.innerHTML = '<div class="empty-note">No character selected.</div>'; return; }
  const cls = getClassDef(c.playerClass);
  const rank = RANK_BY_ID[c.rank] || RANKS[0];
  const remaining = systemPointsRemaining(c);
  const total = systemPointsTotal(c);
  const spent = systemPointsSpent(c);
  const hpPct = c.hp.max > 0 ? (c.hp.current / c.hp.max * 100) : 0;
  const mpPct = c.mana.max > 0 ? (c.mana.current / c.mana.max * 100) : 0;
  const lvl = Number(c.level) || 1;
  const sysLvl = Number(c.systemLevel) || 1;
  const classLabel = cls ? `<span style="color:${cls.color}">${cls.icon} ${cls.label}</span>` : (sysLvl >= 10 ? '<span style="color:var(--amber)">Awaiting Class</span>' : '<span style="color:var(--text-dim)">Locked (Sys.Lv.10)</span>');

  // EXP bar calculations
  const expCurrent = expIntoCurrentLevel(c);
  const expNeeded = expNeededForNextLevel(c);
  const expPct = expNeeded > 0 ? Math.min(100, (expCurrent / expNeeded) * 100) : 0;

  try {
  host.innerHTML = `
    <div class="sw-ornament tl"></div>
    <div class="sw-ornament tr"></div>
    <div class="sw-ornament bl"></div>
    <div class="sw-ornament br"></div>
    <div class="sw-crest"></div>
    <h2 class="sw-title">STATUS</h2>

    <div class="sw-command-summary">
      <div class="sw-command-id">
        <span class="sw-overline">SYSTEM USER</span>
        <strong>${esc(c.name||'UNREGISTERED')}</strong>
        <small>${rank.tier} · ${cls?esc(cls.label):'UNASSIGNED CLASS'}</small>
      </div>
      <div class="sw-readiness ${hpPct<=25?'critical':c.fatigue>=70?'warning':'ready'}">
        <span>COMBAT READINESS</span>
        <strong>${c.state==='dead'?'DECEASED':hpPct<=25?'CRITICAL':c.fatigue>=70?'FATIGUED':'OPERATIONAL'}</strong>
      </div>
      <div class="sw-snapshot-cell"><span>AC</span><strong>${c.armor||10}</strong></div>
      <div class="sw-snapshot-cell"><span>INIT</span><strong>${fmtMod(calcInitiative(c))}</strong></div>
      <div class="sw-snapshot-cell"><span>GOLD</span><strong>${fmtGold(c.points||0)}</strong></div>
    </div>

    <div class="sw-alert-row">
      ${c.fatigue>=80?'<span class="sw-alert danger">⚠ SEVERE FATIGUE</span>':c.fatigue>=50?'<span class="sw-alert warn">▲ FATIGUE RISING</span>':'<span class="sw-alert good">● FATIGUE NOMINAL</span>'}
      ${c.hp.current<=0?'<span class="sw-alert danger">☠ ZERO HP</span>':hpPct<=25?'<span class="sw-alert danger">♥ HP CRITICAL</span>':'<span class="sw-alert good">♥ VITALS STABLE</span>'}
      ${(c.skillStones||[]).length?`<span class="sw-alert info">💎 ${c.skillStones.length} SKILL STONE${c.skillStones.length===1?'':'S'}</span>`:''}
      ${(state.cases||[]).filter(q=>q.status==='active').length?`<span class="sw-alert info">📜 ${(state.cases||[]).filter(q=>q.status==='active').length} ACTIVE QUEST${(state.cases||[]).filter(q=>q.status==='active').length===1?'':'S'}</span>`:''}
    </div>

    <div class="sw-info-grid">
      <div class="sw-info-row">
        <span class="sw-label">NAME:</span>
        <span class="sw-value">${esc(c.name || '—')}</span>
        <span class="sw-label">LEVEL:</span>
        <span class="sw-value">${sysLvl}</span>
      </div>
      <div class="sw-info-row">
        <span class="sw-label">JOB:</span>
        <span class="sw-value">${classLabel}</span>
        <span class="sw-label">DND LV:</span>
        <span class="sw-value">${lvl}</span>
      </div>
      <div class="sw-info-row">
        <span class="sw-label">TITLE:</span>
        <span class="sw-value">${c.title ? `<strong style="color:${esc(titleDefByName(c.title)?.color||'#b8ddff')}">${esc(c.title)}</strong>${titleDefByName(c.title)?.passive?`<small class="sw-title-passive">${esc(titleDefByName(c.title).passive)}</small>`:''}` : 'None'}</span>
        <span class="sw-label">FATIGUE:</span>
        <span class="sw-value">${c.fatigue || 0}</span>
      </div>
    </div>

    <div class="sw-bars">
      <div class="sw-bar-group">
        <span class="sw-bar-label">HP:</span>
        <span class="sw-bar-nums">${c.hp.current} / ${c.hp.max}</span>
        <div class="sw-bar hp"><div class="sw-bar-fill" style="width:${hpPct}%"></div></div>
      </div>
      <div class="sw-bar-group">
        <span class="sw-bar-label">MP:</span>
        <span class="sw-bar-nums">${c.mana.current} / ${c.mana.max}</span>
        <div class="sw-bar mp"><div class="sw-bar-fill" style="width:${mpPct}%"></div></div>
      </div>
      <div class="sw-bar-group">
        <span class="sw-bar-label">EXP:</span>
        <span class="sw-bar-nums">${fmtGold(expCurrent)} / ${fmtGold(expNeeded)}</span>
        <div class="sw-bar exp"><div class="sw-bar-fill" style="width:${expPct}%"></div></div>
      </div>
    </div>

    <div class="sw-divider"><span class="sw-diamond">◆</span></div>

    <div class="sw-sys-stats">
      ${Object.entries(SYSTEM_STAT_LABELS).map(([key, label]) => {
        const val = Number(c.systemStats?.[key]) || 0;
        const conv = systemStatProgress(val);
        const canAdd = remaining > 0;
        const hpTag = key === 'con' ? `<span class="sw-sys-tag hp-tag">+4 HP / STATUS</span>` : '';
        const mpTag = key === 'int' ? `<span class="sw-sys-tag mp-tag">+4 MP / STATUS</span>` : '';
        return `
        <div class="sw-sys-row">
          <div class="sw-sys-label-wrap">
            <span class="sw-sys-label">${label.toUpperCase()}:${hpTag}${mpTag}</span>
            <span class="sw-sys-conversion">+${conv.bonus} DnD · ${conv.progress}/${conv.needed} TO NEXT</span>
          </div>
          <span class="sw-sys-value">${val}</span>
          <div class="sw-sys-adj">
            <button class="sw-sys-btn plus" data-sysstat="${key}" ${canAdd?'':'disabled'} title="+1 ${label}${key==='con'?' (+4 HP)':''}${key==='int'?' (+4 MP)':''}">▲</button>
            <button class="sw-sys-btn minus" data-sysstat="${key}" ${val<=0?'disabled':''} title="-1 ${label}">▼</button>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="sw-divider"><span class="sw-diamond">◆</span></div>

    <section class="sw-milestone-passives">
      <div class="sw-mp-head">
        <div>
          <span>SYSTEM ASCENSION</span>
          <strong>STAT MILESTONE PASSIVES</strong>
        </div>
        <small>50 → 100 → 200 → 400 → 800 → …</small>
      </div>
      <div class="sw-mp-grid">
        ${Object.entries(SYSTEM_STAT_LABELS).map(([key,label])=>{
          const info=systemMilestoneInfo(key,c.systemStats?.[key]);
          const pct=Math.max(0,Math.min(100,((Number(c.systemStats?.[key])||0)/(info.next||50))*100));
          return `<article class="sw-mp-card ${info.tier?'unlocked':'locked'}">
            <div class="sw-mp-top">
              <span class="sw-mp-icon">${info.icon}</span>
              <div><small>${label.toUpperCase()}</small><strong>${esc(info.name)}</strong></div>
              <b>${info.tier?'RANK '+romanNumeral(info.tier):'LOCKED'}</b>
            </div>
            <p>${esc(info.effect)}</p>
            <div class="sw-mp-progress"><i style="width:${pct}%"></i></div>
            <div class="sw-mp-foot">
              <span>${Number(c.systemStats?.[key])||0} STATUS</span>
              <span>${info.tier?`NEXT: ${info.next}`:`UNLOCK: ${info.next}`}</span>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>

    <div class="sw-divider"><span class="sw-diamond">◆</span></div>

    <div class="sw-remaining">
      <span class="sw-remaining-label">REMAINING POINTS:</span>
      <span class="sw-remaining-value ${remaining>0?'has-points':''}">${remaining}</span>
      <span class="sw-remaining-sub">(${spent} / ${total} used)</span>
      <span class="sw-conversion-rule">5 STATUS POINTS = +1 DnD ABILITY POINT</span>
    </div>

    <div class="sw-divider"><span class="sw-diamond">◆</span></div>

    <div class="sw-dnd-info">
      <div class="sw-dnd-row">
        <span class="sw-label">PROF. BONUS:</span>
        <span class="sw-value" style="color:var(--accent)">+${profBonus(c)}</span>
        <span class="sw-label">BASE STAT PTS:</span>
        <span class="sw-value">${totalBasePoints(c)} (${basePointsRemaining(c)} left)</span>
      </div>
      <div class="sw-dnd-row">
        <span class="sw-label">NEXT DND LV:</span>
        <span class="sw-value">${lvl < 20 ? `Lv.${(lvl)*10+1} (${(lvl)*10+1 - sysLvl} sys.levels away)` : 'MAX LEVEL'}</span>
      </div>
    </div>
    <div class="sw-quick-actions">
      <button type="button" data-sw-action="heal">+10 HP</button>
      <button type="button" data-sw-action="mana">+10 MP</button>
      <button type="button" data-sw-action="rest">FULL REST</button>
      <button type="button" data-sw-action="profile">OPEN PROFILE</button>
    </div>
    ${cls ? `<div class="sw-class-bonuses">${Object.entries(cls.bonuses||{}).filter(([,v])=>v>0).map(([k,v])=>`<span class="sw-class-bonus-tag">+${v} ${k}</span>`).join('')}</div>` : ''}
    ${systemPointsRemaining(c) > 0 ? `<div class="sw-milestone">▲ ${systemPointsRemaining(c)} SYSTEM POINTS AVAILABLE — ALLOCATE ABOVE ▲</div>` : ''}
  `;
  } catch(err) {
    console.error('renderStatusWindow error:', err);
    host.innerHTML = `<div style="position:relative;z-index:5;color:#ff6b6b;padding:2rem;font-family:monospace;font-size:.8rem">
      <strong>Status Window Error</strong><br>${err.message}<br><pre>${err.stack}</pre>
    </div>`;
    return;
  }

  host.querySelectorAll('[data-sw-action]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!canEdit() && btn.dataset.swAction!=='profile') return;
    switch(btn.dataset.swAction){
      case 'heal': c.hp.current=clamp((Number(c.hp.current)||0)+10,0,c.hp.max); break;
      case 'mana': c.mana.current=clamp((Number(c.mana.current)||0)+10,0,c.mana.max); break;
      case 'rest':
        c.hp.current=c.hp.max; c.mana.current=c.mana.max; c.fatigue=0; c.tempHp=0;
        c.deathSaves={successes:0,failures:0,stable:false}; break;
      case 'profile':
        state.activeTab='profile'; renderTabs(); return;
    }
    pushState(true); renderStatusWindow(); renderHeader();
  }));

  // Wire system stat +/- buttons
  host.querySelectorAll('.sw-sys-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sysstat;
      const dir = btn.classList.contains('plus') ? 1 : -1;
      if (dir > 0 && systemPointsRemaining(c) <= 0) return;
      const newVal = (Number(c.systemStats[key]) || 0) + dir;
      if (newVal < 0) return;
      c.systemStats[key] = newVal;

      // System stat → HP/MP scaling
      // Every point in Vitality (CON) = +4 Max HP
      // Every point in Intelligence (INT) = +4 Max MP
      if (key === 'con') {
        c.hp.max = Math.max(0, (c.hp.max || 0) + (dir * 4));
        c.hp.current = Math.min(c.hp.current, c.hp.max);
      }
      if (key === 'int') {
        c.mana.max = Math.max(0, (c.mana.max || 0) + (dir * 4));
        c.mana.current = Math.min(c.mana.current, c.mana.max);
      }

      pushState(true);
      renderStatusWindow();
      renderStats();
      renderSkillsMatrix();
      renderCalcPanel();
      renderHeader();
      renderMainFields();
    });
  });
}

// ── SKILLS MATRIX — grouped by stat, tooltip on hover ──
function renderSkillsMatrix(){
  const c = getChar();
  const host = el('skillsMatrix'); if(!host) return;

  // Group skills by their governing stat
  const groups = {};
  SKILL_DEFS.forEach(def => {
    if (!groups[def.stat]) groups[def.stat] = [];
    groups[def.stat].push(def);
  });

  // Preserve stat order (STR → CHA)
  const statOrder = ['STR','DEX','CON','INT','WIS','CHA'];

  host.innerHTML = statOrder.map(stat => {
    const skills = groups[stat] || [];
    const baseScore = Number(c.stats?.[stat]) || 8;
    const effectiveScore = effectiveStat(c, stat);
    const statMod = mod(effectiveScore);
    const systemKey = stat.toLowerCase();
    const systemBonus = systemStatDndBonus(c.systemStats?.[systemKey]);
    const classBonus = Number(getClassDef(c.playerClass)?.bonuses?.[stat]) || 0;
    // Sort: save first, then everything else in declaration order
    const sorted = skills.slice().sort((a, b) => (b.isSave?1:0) - (a.isSave?1:0));

    return `
    <div class="skill-group" data-stat="${stat}">
      <div class="skill-group-head">
        <span class="sgh-stat" data-tt="Governs the skills below. All skill totals use your upgraded/effective ${stat} score.">${stat}</span>
        <span class="sgh-name">${esc(STAT_FULL[stat] || stat)}</span>
        <span class="sgh-score-detail" data-tt="Base ${baseScore}${systemBonus?` · +${systemBonus} Status`:''}${classBonus?` · +${classBonus} Class`:''}">
          ${effectiveScore}${effectiveScore!==baseScore?` <small>EFF</small>`:''}
        </span>
        <span class="sgh-mod ${statMod>=0?'pos':'neg'}">${fmtMod(statMod)}</span>
      </div>
      <div class="skill-group-body">
        ${sorted.map(def => {
          const sk = c.skills[def.name] || {prof:false,expert:false,misc:0};
          const total = skillTotal(c, def.name);
          const archiveBonus = archetypeSkillBonus(c, def.name);
          const isSense = def.name === 'Mana Sense';
          const desc = SKILL_DESCS[def.name] || '';
          return `
          <div class="skill-row${def.isSave?' save-row':''}${isSense?' sense-row':''}"
               data-skill="${esc(def.name)}"
               data-tt="${esc(desc)}">
            <div class="skill-prof">
              <button class="prof-dot ${sk.prof?'on':''}" data-skill="${esc(def.name)}" data-kind="prof" data-tt="Trained — proficient in this skill (+ prof bonus)"></button>
              <button class="prof-dot expert ${sk.expert?'on':''}" data-skill="${esc(def.name)}" data-kind="expert" data-tt="Specialist — expertise in this skill (×2 prof bonus)"></button>
            </div>
            <div class="skill-name">${esc(def.name)}${isSense?' <span class="sense-tag" data-tt="Mana perception — sense magical energies and hidden enchantments">◈</span>':''}</div>
            <div class="skill-total" ${archiveBonus?`data-tt="System Archive bonus: +${archiveBonus}"`:``}>${fmtMod(total)}${archiveBonus?`<small class="archive-skill-bonus">+${archiveBonus} SYS</small>`:``}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  host.querySelectorAll('.prof-dot').forEach(dot=>{
    dot.addEventListener('click', ()=>{
      const name = dot.dataset.skill, kind = dot.dataset.kind;
      const sk = c.skills[name];
      if(kind==='prof'){ sk.prof=!sk.prof; if(!sk.prof) sk.expert=false; }
      else { sk.expert=!sk.expert; if(sk.expert) sk.prof=true; }
      pushState(true); renderSkillsMatrix(); renderCalcPanel();
    });
  });
}

// ── CALC PANEL ──
function renderCalcPanel(){
  const c = getChar();
  const host = el('calcPanel'); if(!host) return;
  const pb = profBonus(c);
  host.innerHTML = `
    <div class="calc-grid">
      <div class="calc-cell"><span class="calc-k">Prof. Bonus</span><span class="calc-v">${fmtMod(pb)}</span></div>
      <div class="calc-cell"><span class="calc-k">Initiative</span><span class="calc-v">${fmtMod(calcInitiative(c))}</span></div>
      <div class="calc-cell"><span class="calc-k">Attack</span><span class="calc-v">${fmtMod(attackBonus(c))}</span></div>
      <div class="calc-cell"><span class="calc-k">Passive Perc.</span><span class="calc-v">${passivePerception(c)}</span></div>
      <div class="calc-cell"><span class="calc-k">Mana Sense</span><span class="calc-v">${fmtMod(skillTotal(c,'Mana Sense'))}</span></div>
      <div class="calc-cell"><span class="calc-k">Armor Class</span><span class="calc-v">${c.armor}</span></div>
    </div>
    <div class="calc-settings">
      <label class="calc-set"><span>PB Override</span><input id="pbOverrideInp" type="number" value="${c.profBonusOverride??''}" placeholder="auto"></label>
      <label class="calc-set"><span>Init Bonus</span><input id="initBonusInp" type="number" value="${c.initiativeBonus||0}"></label>
      <label class="calc-set"><span>Attack Stat</span>
        <select id="attackStatSel">${STATS.map(s=>`<option value="${s}" ${c.attackStat===s?'selected':''}>${s}</option>`).join('')}</select>
      </label>
    </div>`;
  el('pbOverrideInp')?.addEventListener('input', e=>{ const v=e.target.value.trim(); c.profBonusOverride = v===''?null:Number(v); pushState(); renderCalcPanel(); renderSkillsMatrix(); renderHeader(); });
  el('initBonusInp')?.addEventListener('input', e=>{ c.initiativeBonus=Number(e.target.value)||0; pushState(); renderCalcPanel(); });
  el('attackStatSel')?.addEventListener('change', e=>{ c.attackStat=e.target.value; pushState(true); renderCalcPanel(); });
}

// ── DEATH SAVES ──
function renderDeathSaves(){
  const c = getChar();
  const host = el('deathSaves'); if(!host) return;
  const ds = c.deathSaves;
  host.innerHTML = `
    <div class="ds-row"><span class="ds-label">Successes</span><div class="ds-pips">${[0,1,2].map(i=>`<button class="ds-pip succ ${i<ds.successes?'on':''}" data-kind="successes" data-i="${i}"></button>`).join('')}</div></div>
    <div class="ds-row"><span class="ds-label">Failures</span><div class="ds-pips">${[0,1,2].map(i=>`<button class="ds-pip fail ${i<ds.failures?'on':''}" data-kind="failures" data-i="${i}"></button>`).join('')}</div></div>`;
  host.querySelectorAll('.ds-pip').forEach(p=>{
    p.addEventListener('click', ()=>{
      const kind=p.dataset.kind, i=parseInt(p.dataset.i);
      ds[kind] = (ds[kind]===i+1)?i:i+1;
      pushState(true); renderDeathSaves();
    });
  });
}

// ================================================================
// WEAPONS
// ================================================================
function renderWeapons(){
  const c = getChar();
  const host = el('weaponsList'); if(!host) return;
  if(!Array.isArray(c.weapons)) c.weapons=[];
  if(!c.weapons.length){ host.innerHTML = `<div class="empty-note">No weapons logged.</div>`; return; }
  host.innerHTML = c.weapons.map((w,i)=>`
    <div class="wpn-card train-${(w.training||'Untrained').toLowerCase()}">
      <div class="wpn-head">
        <input class="wpn-name" data-i="${i}" value="${esc(w.name||'')}" placeholder="Weapon name">
        <span class="wpn-train-badge train-${(w.training||'Untrained').toLowerCase()}">${esc(w.training||'Untrained')}</span>
        <button class="wpn-del" data-i="${i}">✕</button>
      </div>
      <div class="wpn-stats">
        <label><span>Damage</span><input class="wpn-dmg" data-i="${i}" value="${esc(w.damage||'')}" placeholder="2d6"></label>
        <label><span>Type</span><select class="wpn-type" data-i="${i}">${DMG_TYPES.map(t=>`<option ${w.dmgType===t?'selected':''}>${t}</option>`).join('')}</select></label>
        <label><span>Range</span><input class="wpn-range" data-i="${i}" value="${esc(w.range||'')}" placeholder="Melee / 60ft"></label>
        <label><span>Training</span><select class="wpn-training" data-i="${i}">${TRAINING.map(t=>`<option ${w.training===t?'selected':''}>${t}</option>`).join('')}</select></label>
      </div>
      <textarea class="wpn-notes" data-i="${i}" placeholder="Notes, properties, anomalous effects…">${esc(w.notes||'')}</textarea>
    </div>`).join('');
  const upd = (sel,key)=> host.querySelectorAll(sel).forEach(inp=> inp.addEventListener('input', ()=>{ c.weapons[+inp.dataset.i][key]=inp.value; pushState(); }));
  upd('.wpn-name','name'); upd('.wpn-dmg','damage'); upd('.wpn-range','range'); upd('.wpn-notes','notes');
  host.querySelectorAll('.wpn-type').forEach(s=> s.addEventListener('change',()=>{ c.weapons[+s.dataset.i].dmgType=s.value; pushState(true); }));
  host.querySelectorAll('.wpn-training').forEach(s=> s.addEventListener('change',()=>{ c.weapons[+s.dataset.i].training=s.value; pushState(true); renderWeapons(); }));
  host.querySelectorAll('.wpn-del').forEach(b=> b.addEventListener('click',()=>{ c.weapons.splice(+b.dataset.i,1); pushState(true); renderWeapons(); }));
}
function addWeapon(){ const c=getChar(); if(!Array.isArray(c.weapons))c.weapons=[]; c.weapons.push({name:'',damage:'',dmgType:'Ballistic',range:'',training:'Untrained',notes:''}); pushState(true); renderWeapons(); }

// ================================================================
// INVENTORY  (qty-tracked, categorized, value for shop sell)
// ================================================================

function findTowerShopItem(name){
  const key=String(name||'').trim().toLowerCase();
  if(!key) return null;
  const pools=[
    ...(Array.isArray(state.shop)?state.shop:[]),
    ...(typeof getDefaultTowerShop==='function'?getDefaultTowerShop():[])
  ];
  return pools.find(x=>String(x?.name||'').trim().toLowerCase()===key)||null;
}
function inventoryItemFromShop(item, qty=1, source='shop', questName=''){
  if(!item) return null;
  return {
    name:String(item.name||'Item'), qty:Math.max(1,Number(qty)||1),
    category:mapShopCatToInv(item.category), value:Math.floor((Number(item.price)||0)*.5),
    notes:String(item.desc||''), description:String(item.desc||''),
    rarity:String(item.rarity||'common'), icon:item.icon||'◆', stats:String(item.stats||''),
    tier:Number(item.tier)||1, shopCategory:String(item.category||'Misc'),
    source, questName:String(questName||''),
    effect:item.effect ? JSON.parse(JSON.stringify(item.effect)) : null
  };
}
function giveTowerShopItem(c, itemOrName, qty=1, source='gm', questName=''){
  if(!c) return false;
  const item=typeof itemOrName==='string'?findTowerShopItem(itemOrName):itemOrName;
  if(!item) return false;
  if(!Array.isArray(c.inventory)) c.inventory=[];
  const key=String(item.name||'').toLowerCase();
  const existing=c.inventory.find(x=>String(x.name||'').toLowerCase()===key && (x.source||'')===source);
  if(existing){
    existing.qty=(Number(existing.qty)||1)+Math.max(1,Number(qty)||1);
    existing.notes=existing.notes||item.desc||'';
    existing.description=existing.description||item.desc||'';
    existing.rarity=existing.rarity||item.rarity||'common';
    existing.stats=existing.stats||item.stats||'';
    existing.icon=existing.icon||item.icon||'◆';
    existing.source=source;
    if(questName) existing.questName=questName;
  }else{
    c.inventory.push(inventoryItemFromShop(item,qty,source,questName));
  }
  return true;
}
function isSystemShopInventoryItem(it){
  if(!it) return false;
  if(['shop','quest','gm'].includes(it.source)) return true;
  return !!findTowerShopItem(it.name);
}
function renderInventoryCard(it,i,systemItem=false){
  const desc=String(it.description||it.notes||'').trim();
  const sourceLabel=it.source==='quest'?(it.questName?`QUEST · ${it.questName}`:'QUEST REWARD'):it.source==='gm'?'GM AWARD':'TOWER EXCHANGE';
  return `<div class="inv-item ${systemItem?'system-shop-item':''} cat-${(it.category||'Misc').toLowerCase()}" data-inv-index="${i}">
      <div class="inv-qty-ctrl">
        <button class="inv-q minus" data-i="${i}">−</button>
        <span class="inv-q-num">${Number(it.qty)||1}</span>
        <button class="inv-q plus" data-i="${i}">+</button>
      </div>
      <div class="inv-item-main">
        <div class="inv-item-titleline">
          <span class="inv-item-icon">${esc(it.icon||'◆')}</span>
          <input class="inv-name" data-i="${i}" value="${esc(it.name||'')}" placeholder="Item">
          ${systemItem?`<span class="inv-source-tag">${esc(sourceLabel)}</span>`:''}
          ${it.rarity?`<span class="inv-rarity-tag rarity-${esc(String(it.rarity).toLowerCase())}">${esc(String(it.rarity).toUpperCase())}</span>`:''}
        </div>
        ${desc?`<div class="inv-shop-description">${esc(desc)}</div>`:''}
        ${it.stats?`<div class="inv-shop-stats">${esc(it.stats)}</div>`:''}
      </div>
      <select class="inv-cat" data-i="${i}">${ITEM_CATEGORIES.map(t=>`<option ${it.category===t?'selected':''}>${t}</option>`).join('')}</select>
      <div class="inv-val"><input class="inv-value" data-i="${i}" type="number" value="${it.value??''}" placeholder="0"><span>gold</span></div>
      ${it.effect && canEdit()? `<button class="inv-use" data-i="${i}" title="${it.category==='Loot Box'?'Open':'Use'} ${esc(it.name||'item')}">${it.category==='Loot Box'?'OPEN':'USE'}</button>`:''}
      ${canEdit()? `<button class="inv-sell" data-i="${i}" title="Sell to Tower Exchange">SELL</button>`:''}
      <button class="inv-del" data-i="${i}">✕</button>
    </div>`;
}

function renderInventory(){
  const c = getChar();
  const host = el('inventoryList'); if(!host) return;
  if(!Array.isArray(c.inventory)) c.inventory=[];
  const totalVal = c.inventory.reduce((s,it)=> s + (Number(it.value)||0)*(Number(it.qty)||1), 0);
  const tv = el('inventoryValue'); if(tv) tv.textContent = fmtGold(totalVal);
  if(!c.inventory.length){ host.innerHTML = `<div class="empty-note">Inventory empty.</div>`; return; }
  const systemItems=c.inventory.map((it,i)=>({it,i})).filter(x=>isSystemShopInventoryItem(x.it));
  const normalItems=c.inventory.map((it,i)=>({it,i})).filter(x=>!isSystemShopInventoryItem(x.it));
  host.innerHTML = `
    ${systemItems.length?`<section class="inv-system-section">
      <div class="inv-section-head"><span>◇ SYSTEM ACQUISITIONS</span><small>${systemItems.length} UNIQUE RECORD${systemItems.length===1?'':'S'}</small></div>
      <div class="inv-system-grid">${systemItems.map(({it,i})=>renderInventoryCard(it,i,true)).join('')}</div>
    </section>`:''}
    ${normalItems.length?`<section class="inv-standard-section">
      <div class="inv-section-head"><span>▣ STANDARD INVENTORY</span><small>${normalItems.length} RECORD${normalItems.length===1?'':'S'}</small></div>
      <div class="inv-standard-list">${normalItems.map(({it,i})=>renderInventoryCard(it,i,false)).join('')}</div>
    </section>`:''}`;
  host.querySelectorAll('.inv-name').forEach(inp=> inp.addEventListener('input',()=>{ c.inventory[+inp.dataset.i].name=inp.value; pushState(); }));
  host.querySelectorAll('.inv-value').forEach(inp=> inp.addEventListener('input',()=>{ c.inventory[+inp.dataset.i].value=Number(inp.value)||0; pushState(); renderInventory(); }));
  host.querySelectorAll('.inv-cat').forEach(s=> s.addEventListener('change',()=>{ c.inventory[+s.dataset.i].category=s.value; pushState(true); renderInventory(); }));
  host.querySelectorAll('.inv-q.plus').forEach(b=> b.addEventListener('click',()=>{ const it=c.inventory[+b.dataset.i]; it.qty=(Number(it.qty)||1)+1; pushState(true); renderInventory(); }));
  host.querySelectorAll('.inv-q.minus').forEach(b=> b.addEventListener('click',()=>{ const it=c.inventory[+b.dataset.i]; it.qty=Math.max(1,(Number(it.qty)||1)-1); pushState(true); renderInventory(); }));
  host.querySelectorAll('.inv-del').forEach(b=> b.addEventListener('click',()=>{ c.inventory.splice(+b.dataset.i,1); pushState(true); renderInventory(); }));
  host.querySelectorAll('.inv-use').forEach(b=> b.addEventListener('click',()=>{ useInventoryItem(+b.dataset.i); }));
  host.querySelectorAll('.inv-sell').forEach(b=> b.addEventListener('click',()=>{ sellItem(+b.dataset.i); }));
}

function consumeInventoryUnit(c,i){
  const it=c.inventory[i]; if(!it) return;
  it.qty=(Number(it.qty)||1)-1;
  if(it.qty<=0) c.inventory.splice(i,1);
}
function useInventoryItem(i){
  const c=getChar(); const it=c.inventory?.[i]; if(!c||!it||!it.effect) return;
  const e=it.effect;
  let msg='';
  switch(e.kind){
    case 'healHp': {
      const before=Number(c.hp.current)||0;
      c.hp.current=clamp(before+(Number(e.amount)||0),0,c.hp.max);
      msg=`${it.name}: +${c.hp.current-before} HP`; break;
    }
    case 'healMp': {
      const before=Number(c.mana.current)||0;
      c.mana.current=clamp(before+(Number(e.amount)||0),0,c.mana.max);
      msg=`${it.name}: +${c.mana.current-before} MP`; break;
    }
    case 'restoreBoth': {
      const hp0=Number(c.hp.current)||0, mp0=Number(c.mana.current)||0;
      c.hp.current=clamp(hp0+(Number(e.hp)||0),0,c.hp.max);
      c.mana.current=clamp(mp0+(Number(e.mp)||0),0,c.mana.max);
      msg=`${it.name}: +${c.hp.current-hp0} HP · +${c.mana.current-mp0} MP`; break;
    }
    case 'fatigue': {
      const before=Number(c.fatigue)||0;
      c.fatigue=clamp(before+(Number(e.amount)||0),0,100);
      msg=`${it.name}: Fatigue ${before} → ${c.fatigue}`; break;
    }
    case 'tempHp': {
      c.tempHp=Math.max(Number(c.tempHp)||0,Number(e.amount)||0);
      msg=`${it.name}: Temp HP set to ${c.tempHp}`; break;
    }
    case 'phoenix': {
      c.hp.current=c.hp.max; c.fatigue=0;
      msg=`${it.name}: HP restored · Fatigue cleared`; break;
    }
    case 'fullRestore': {
      c.hp.current=c.hp.max; c.mana.current=c.mana.max; c.fatigue=0; c.tempHp=0;
      c.deathSaves={successes:0,failures:0,stable:false};
      msg=`${it.name}: Full recovery`; break;
    }
    case 'lootBox': {
      const tier=Math.max(1,Number(e.tier)||1);
      const goldMin=[0,35,90,220,650,1800][tier]||35;
      const goldMax=[0,120,280,700,1900,5000][tier]||120;
      const roll=Math.random();
      if(roll<.58){
        const gold=Math.floor(goldMin+Math.random()*(goldMax-goldMin+1));
        c.points=(Number(c.points)||0)+gold;
        msg=`${it.name} opened: +${fmtGold(gold)} gold`;
      }else{
        const pool=DT_DEFAULT_SHOP.filter(x=>
          x.category==='Consumables' &&
          (Number(x.tier)||1)<=Math.min(4,tier) &&
          x.name!==it.name
        );
        const reward=pool[Math.floor(Math.random()*pool.length)];
        if(reward){
          const ex=c.inventory.find(x=>x.name===reward.name);
          if(ex) ex.qty=(Number(ex.qty)||1)+1;
          else c.inventory.push({name:reward.name,qty:1,category:mapShopCatToInv(reward.category),value:Math.floor((reward.price||0)*.5),notes:reward.desc||'',rarity:reward.rarity||'common',icon:reward.icon||'◆',stats:reward.stats||'',effect:reward.effect?JSON.parse(JSON.stringify(reward.effect)):null});
          msg=`${it.name} opened: ${reward.name}`;
        } else msg=`${it.name} opened.`;
      }
      break;
    }
    default: return;
  }
  consumeInventoryUnit(c,i);
  ensureClamp(c); pushState(true); renderInventory(); renderHeader();
  if(state.activeTab==='status') renderStatusWindow();
  showToast(msg,'buy');
}

function addInventoryItem(){
  const c=getChar(); const name=el('invAddName')?.value.trim(); const qty=Math.max(1,Number(el('invAddQty')?.value)||1);
  const value = Math.max(0, Number(el('invVal')?.value)||0);
  const category = el('invCat')?.value || 'Misc';
  if(!name) return;
  if(!Array.isArray(c.inventory)) c.inventory=[];
  c.inventory.push({name, qty, category, value});
  el('invAddName').value=''; el('invAddQty').value='1'; if(el('invVal')) el('invVal').value='0';
  pushState(true); renderInventory();
  el('invAddName')?.focus();
}
function sellItem(i){
  const c=getChar(); const it=c.inventory[i]; if(!it) return;
  const unit = Number(it.value)||0;
  const refund = Math.floor(unit*0.5); // sell at 50%
  if(!confirm(`Sell 1× ${it.name} to the Shop for ${fmtGold(refund)} gold?`)) return;
  c.points = (Number(c.points)||0) + refund;
  it.qty = (Number(it.qty)||1) - 1;
  if(it.qty<=0) c.inventory.splice(i,1);
  pushState(true); renderInventory(); renderHeader();
  showToast(`Sold ${it.name} · +${fmtGold(refund)} gold`,'sell');
}

// ================================================================
// SHOP (DM-managed catalog; players buy with points)
// ================================================================
let _shopCategory='all';
let _shopQuery='';
let _shopSort='recommended';
let _shopTier='all';
let _shopRarity='all';
let _shopAffordable=false;
let _dmQuestRewardItems=[];

function shopCategoryIcon(cat){
  return {
    Consumables:'🧪',Weapons:'⚔️',Armor:'🛡️',Accessories:'💍',
    'Skill Stones':'💎','Rune Stones':'ᚱ','Loot Boxes':'📦',
    Materials:'🪨',Utilities:'🧭'
  }[cat]||'◆';
}

const SHOP_RARITY_ORDER = {common:1,uncommon:2,rare:3,epic:4,legendary:5};
function compareShopItems(a,b,sort=_shopSort){
  const A=a.item||a, B=b.item||b;
  const ap=Number(A.price)||0, bp=Number(B.price)||0;
  const at=Number(A.tier)||1, bt=Number(B.tier)||1;
  const ar=SHOP_RARITY_ORDER[String(A.rarity||'common').toLowerCase()]||1;
  const br=SHOP_RARITY_ORDER[String(B.rarity||'common').toLowerCase()]||1;
  const an=String(A.name||'').toLowerCase(), bn=String(B.name||'').toLowerCase();
  switch(sort){
    case 'priceAsc': return ap-bp || at-bt || an.localeCompare(bn);
    case 'priceDesc': return bp-ap || bt-at || an.localeCompare(bn);
    case 'tierAsc': return at-bt || ap-bp || an.localeCompare(bn);
    case 'tierDesc': return bt-at || br-ar || bp-ap || an.localeCompare(bn);
    case 'rarityAsc': return ar-br || at-bt || ap-bp || an.localeCompare(bn);
    case 'rarityDesc': return br-ar || bt-at || bp-ap || an.localeCompare(bn);
    case 'nameDesc': return bn.localeCompare(an);
    case 'nameAsc': return an.localeCompare(bn);
    case 'recommended':
    default:
      return at-bt || br-ar || ap-bp || an.localeCompare(bn);
  }
}


function renderShop(){
  const c=getChar();
  const host=el('shopList'); if(!host)return;
  const bal=el('shopBalance'); if(bal)bal.textContent=fmtGold(c.points);
  const myTier=RANK_TO_TIER[c.rank]||1;
  const notice=el('shopNotice');

  if(notice){
    const stock=(state.shop||[]).filter(x=>(Number(x.tier)||1)<=myTier).length;
    notice.innerHTML=`
      <div class="shop-status-strip">
        <span><b>ACCESS</b> <strong style="color:${TIER_COLOR[myTier]}">${TIER_LABEL[myTier]}</strong></span>
        <span><b>AVAILABLE</b> ${stock} ITEMS</span>
        <span><b>BALANCE</b> ◆ ${fmtGold(Number(c.points)||0)}</span>
        <span><b>SELL RATE</b> 50%</span>
        <span><b>NETWORK</b> <i class="shop-online-dot"></i> ONLINE</span>
      </div>`;
  }

  if(!Array.isArray(state.shop)||!state.shop.length){
    host.innerHTML=`<div class="shop-empty-state"><strong>EXCHANGE INVENTORY OFFLINE</strong><span>${dmUnlocked?'Open the GM Console → World → Shop and choose STOCK SYSTEM CATALOG.':'The Game Master has not stocked the Tower Exchange yet.'}</span></div>`;
    if(el('shopFilter'))el('shopFilter').innerHTML='';
    return;
  }

  const accessible=state.shop.map((item,i)=>({item,i}))
    .filter(({item})=>(Number(item.tier)||1)<=myTier);

  const filterHost=el('shopFilter');
  const cats=[...new Set(accessible.map(({item})=>item.category||'Misc'))]
    .sort((a,b)=>SHOP_CATEGORIES.indexOf(a)-SHOP_CATEGORIES.indexOf(b));

  if(filterHost){
    filterHost.innerHTML=`
      <div class="shop-controls-row">
        <div class="shop-search-wrap">
          <span>⌕</span>
          <input id="shopSearchInput" type="search" placeholder="Search equipment, effects, rarity..." value="${esc(_shopQuery)}">
        </div>
        <label class="shop-sort-control">
          <span>SORT</span>
          <select id="shopSortSelect">
            <option value="recommended" ${_shopSort==='recommended'?'selected':''}>Recommended</option>
            <option value="priceAsc" ${_shopSort==='priceAsc'?'selected':''}>Price: Low → High</option>
            <option value="priceDesc" ${_shopSort==='priceDesc'?'selected':''}>Price: High → Low</option>
            <option value="tierAsc" ${_shopSort==='tierAsc'?'selected':''}>Tier: Low → High</option>
            <option value="tierDesc" ${_shopSort==='tierDesc'?'selected':''}>Tier: High → Low</option>
            <option value="rarityAsc" ${_shopSort==='rarityAsc'?'selected':''}>Rarity: Common → Legendary</option>
            <option value="rarityDesc" ${_shopSort==='rarityDesc'?'selected':''}>Rarity: Legendary → Common</option>
            <option value="nameAsc" ${_shopSort==='nameAsc'?'selected':''}>Name: A → Z</option>
            <option value="nameDesc" ${_shopSort==='nameDesc'?'selected':''}>Name: Z → A</option>
          </select>
        </label>
        <label class="shop-sort-control compact">
          <span>TIER</span>
          <select id="shopTierSelect">
            <option value="all" ${_shopTier==='all'?'selected':''}>All unlocked</option>
            ${[1,2,3,4].filter(t=>t<=myTier).map(t=>`<option value="${t}" ${String(_shopTier)===String(t)?'selected':''}>${TIER_LABEL[t]||`Tier ${t}`}</option>`).join('')}
          </select>
        </label>
        <label class="shop-sort-control compact">
          <span>RARITY</span>
          <select id="shopRaritySelect">
            <option value="all" ${_shopRarity==='all'?'selected':''}>All rarities</option>
            ${['common','uncommon','rare','epic','legendary'].map(r=>`<option value="${r}" ${_shopRarity===r?'selected':''}>${r[0].toUpperCase()+r.slice(1)}</option>`).join('')}
          </select>
        </label>
        <button id="shopAffordableBtn" class="shop-affordable-btn ${_shopAffordable?'active':''}" type="button">◆ AFFORDABLE</button>
      </div>
      <div class="shop-category-scroll">
        <button class="shop-filter-btn ${_shopCategory==='all'?'active':''}" data-cat="all">ALL <small>${accessible.length}</small></button>
        ${cats.map(cat=>{
          const n=accessible.filter(x=>(x.item.category||'Misc')===cat).length;
          return `<button class="shop-filter-btn ${_shopCategory===cat?'active':''}" data-cat="${esc(cat)}">${shopCategoryIcon(cat)} ${esc(cat)} <small>${n}</small></button>`;
        }).join('')}
      </div>`;
    el('shopSearchInput')?.addEventListener('input',e=>{_shopQuery=e.target.value||'';renderShop();});
    el('shopSortSelect')?.addEventListener('change',e=>{_shopSort=e.target.value||'recommended';renderShop();});
    el('shopTierSelect')?.addEventListener('change',e=>{_shopTier=e.target.value||'all';renderShop();});
    el('shopRaritySelect')?.addEventListener('change',e=>{_shopRarity=e.target.value||'all';renderShop();});
    el('shopAffordableBtn')?.addEventListener('click',()=>{_shopAffordable=!_shopAffordable;renderShop();});
    filterHost.querySelectorAll('.shop-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
      _shopCategory=btn.dataset.cat||'all'; renderShop();
    }));
  }

  const q=_shopQuery.trim().toLowerCase();
  const filtered=accessible.filter(({item})=>{
    if(_shopCategory!=='all'&&(item.category||'Misc')!==_shopCategory)return false;
    if(_shopTier!=='all' && String(Number(item.tier)||1)!==String(_shopTier)) return false;
    if(_shopRarity!=='all' && String(item.rarity||'common').toLowerCase()!==_shopRarity) return false;
    if(_shopAffordable && (Number(item.price)||0)>(Number(c.points)||0)) return false;
    if(!q)return true;
    return [item.name,item.desc,item.stats,item.rarity,item.category].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  if(!filtered.length){
    host.innerHTML=`<div class="shop-empty-state"><strong>NO MATCHING STOCK</strong><span>Change the category or search terms.</span></div>`;
    return;
  }

  const renderCats=_shopCategory==='all'
    ? cats.filter(cat=>filtered.some(x=>(x.item.category||'Misc')===cat))
    : [_shopCategory];

  host.innerHTML=renderCats.map(cat=>{
    const rows=filtered.filter(({item})=>(item.category||'Misc')===cat)
      .sort((a,b)=>compareShopItems(a,b,_shopSort));
    return `<section class="shop-cat-group" data-cat="${esc(cat)}">
      <div class="shop-cat-header">
        <span class="shop-cat-title">${shopCategoryIcon(cat)} ${esc(cat)}</span>
        <span class="shop-cat-count">${rows.length} STOCK</span>
      </div>
      <div class="shop-card-grid">
      ${rows.map(({item,i})=>{
        const basePrice=Number(item.price)||0;
        const merchantDiscount=(c.archetypeDiscountUses||0)>0 && (c.discoveredSystemArchetypes||[]).includes('merchant');
        const price=merchantDiscount?Math.ceil(basePrice*.95):basePrice;
        const afford=(Number(c.points)||0)>=price;
        const sold=item.stock!=null&&item.stock<=0;
        const tier=Number(item.tier)||1;
        const rarity=item.rarity||'common';
        const rarCol=RARITY_COLORS[rarity]||RARITY_COLORS.common;
        const tierLabel=TIER_LABEL[tier]||`T${tier}`;
        return `<article class="shop-item-card ${sold?'out':''}" style="--rarity-c:${rarCol};--tier-c:${TIER_COLOR[tier]||'#5ee7ff'}">
          <div class="shop-item-top">
            <div class="shop-item-icon">${esc(item.icon||shopCategoryIcon(cat))}</div>
            <div class="shop-item-tier">${esc(tierLabel)}</div>
          </div>
          <div class="shop-item-name">${esc(item.name||'Item')}</div>
          <div class="shop-item-tags">
            <span class="shop-rarity-tag" style="color:${rarCol};border-color:${rarCol}">${rarity.toUpperCase()}</span>
            ${item.stats?`<span class="shop-stats-tag">${esc(item.stats)}</span>`:''}
          </div>
          <div class="shop-item-desc">${esc(item.desc||'No item description available.')}</div>
          <div class="shop-item-foot">
            <div class="shop-price"><small>◆</small> ${fmtGold(price)}${merchantDiscount?` <em class="archive-discount">-5% SYS</em>`:``}</div>
            ${sold?'<span class="shop-out-tag">SOLD OUT</span>':canEdit()?`<button class="shop-buy-btn ${afford?'':'cant'}" data-i="${i}" ${afford?'':'disabled'}>${afford?'PURCHASE':'INSUFFICIENT'}</button>`:''}
          </div>
        </article>`;
      }).join('')}
      </div>
    </section>`;
  }).join('');

  host.querySelectorAll('.shop-buy-btn:not(:disabled)').forEach(b=>b.addEventListener('click',()=>buyItem(+b.dataset.i)));
}
function buyItem(i){
  const c=getChar(); const item=state.shop[i]; if(!item) return;
  const myTier = RANK_TO_TIER[c.rank] || 1;
  const itemTier = Number(item.tier)||1;
  if(itemTier > myTier){ showToast(`Requires ${TIER_LABEL[itemTier]} clearance`,'warn'); return; }
  const basePrice=Number(item.price)||0;
  const merchantDiscount=(c.archetypeDiscountUses||0)>0 && (c.discoveredSystemArchetypes||[]).includes('merchant');
  const price=merchantDiscount?Math.ceil(basePrice*.95):basePrice;
  if((Number(c.points)||0) < price){ showToast('Insufficient gold','warn'); return; }
  if(item.stock!=null && item.stock<=0){ showToast('Sold out','warn'); return; }
  if(!confirm(`Buy ${item.name} for ${fmtGold(price)} gold?`)) return;
  c.points -= price;
  if(merchantDiscount) c.archetypeDiscountUses=Math.max(0,(c.archetypeDiscountUses||0)-1);
  if(item.stock!=null) item.stock -= 1;
  if(!Array.isArray(c.inventory)) c.inventory=[];
  const existing = c.inventory.find(x=> x.name===item.name);
  if(existing){
    existing.qty = (Number(existing.qty)||1)+1;
    if(item.effect && !existing.effect) existing.effect = JSON.parse(JSON.stringify(item.effect));
    existing.source=existing.source||'shop';
    existing.notes=existing.notes||item.desc||'';
    existing.description=existing.description||item.desc||'';
    existing.rarity=existing.rarity||item.rarity||'common';
    existing.icon=existing.icon||item.icon||'◆';
    existing.stats=existing.stats||item.stats||'';
    existing.tier=existing.tier||Number(item.tier)||1;
    existing.shopCategory=existing.shopCategory||item.category||'Misc';
  } else c.inventory.push({
    name:item.name, qty:1, category:mapShopCatToInv(item.category),
    value:Math.floor(price*0.5), notes:item.desc||'',
    rarity:item.rarity||'common', icon:item.icon||'◆', stats:item.stats||'',
    description:item.desc||'', source:'shop', tier:Number(item.tier)||1, shopCategory:item.category||'Misc',
    effect:item.effect ? JSON.parse(JSON.stringify(item.effect)) : null
  });
  pushState(true); renderShop(); renderInventory(); renderHeader();
  showToast(`Acquired ${item.name}`,'buy');
}
// map a shop category to an inventory category bucket
function mapShopCatToInv(cat){
  switch(cat){
    case 'Weapons': case 'Combat': return 'Weapon';
    case 'Armor': case 'Protection': return 'Armor';
    case 'Accessories': return 'Accessory';
    case 'Consumables': case 'Medical': case 'Warding & Barriers': return 'Consumable';
    case 'Skill Stones': return 'Skill Stone';
    case 'Rune Stones': return 'Rune Stone';
    case 'Loot Boxes': return 'Loot Box';
    case 'Materials': return 'Material';
    case 'Utilities': case 'Utility': return 'Utility';
    case 'Anomalous Items': return 'Anomalous';
    default: return 'Misc';
  }
}

// ================================================================
// ITEM REQUESTS — players ask for items not in the catalog
// ================================================================
// Player-side: see your own requests + their status
// DM-side: review queue
function renderDmRequests(){
  const host = el('dmRequestsList'); if(!host) return;
  const reqs = (state.requests||[]).filter(r=>r.status==='pending');
  const badge = el('reqBadge');
  if(badge){ badge.textContent = reqs.length||''; badge.style.display = reqs.length?'inline-flex':'none'; }
  if(!reqs.length){ host.innerHTML = `<div class="empty-note">No pending requests.</div>`; return; }
  host.innerHTML = reqs.slice().reverse().map(r=>`
    <div class="dm-req-card" data-id="${r.id}">
      <div class="dm-req-head">
        <span class="dm-req-item">${esc(r.item)}</span>
        <span class="dm-req-by">— ${esc(r.by)}</span>
      </div>
      ${r.note?`<div class="dm-req-note">"${esc(r.note)}"</div>`:''}
      <div class="dm-req-controls">
        <input class="dm-req-price" data-id="${r.id}" type="number" min="0" placeholder="Price" value="100">
        <select class="dm-req-tier" data-id="${r.id}">${[1,2,3,4].map(t=>`<option value="${t}">T${t}</option>`).join('')}</select>
        <select class="dm-req-cat" data-id="${r.id}">${SHOP_CATEGORIES.map(cat=>`<option>${cat}</option>`).join('')}</select>
        <button class="dm-req-approve" data-id="${r.id}">✓ Stock & Approve</button>
        <button class="dm-req-deny" data-id="${r.id}">✕ Deny</button>
      </div>
    </div>`).join('');
  host.querySelectorAll('.dm-req-approve').forEach(b=> b.addEventListener('click', ()=> approveRequest(b.dataset.id)));
  host.querySelectorAll('.dm-req-deny').forEach(b=> b.addEventListener('click', ()=> denyRequest(b.dataset.id)));
}
function approveRequest(id){
  if(!dmUnlocked) return;
  const r = (state.requests||[]).find(x=>x.id===id); if(!r) return;
  const card = document.querySelector(`.dm-req-card[data-id="${id}"]`);
  const price = Math.max(0, Number(card?.querySelector('.dm-req-price')?.value)||0);
  const tier = Number(card?.querySelector('.dm-req-tier')?.value)||1;
  const category = card?.querySelector('.dm-req-cat')?.value || 'Utility';
  if(!Array.isArray(state.shop)) state.shop=[];
  state.shop.push({ tier, name:r.item, category, price, stock:null, desc:r.note||'' });
  r.status = 'approved';
  pushState(true); render();
  SFX?.buy?.();
  showToast(`Stocked "${r.item}" · ${fmtGold(price)} gold`,'buy');
}
function denyRequest(id){
  if(!dmUnlocked) return;
  const r = (state.requests||[]).find(x=>x.id===id); if(!r) return;
  r.status = 'denied';
  pushState(true); render();
  showToast(`Denied request: ${r.item}`,'warn');
}
function clearResolvedRequests(){
  if(!dmUnlocked) return;
  state.requests = (state.requests||[]).filter(r=>r.status==='pending');
  pushState(true); render();
  showToast('Cleared resolved requests','info');
}

// ================================================================
// RELATIONSHIPS
// ================================================================
const REL_TYPES = ['Handler','Colleague','Asset','Rival','Threat','Superior','Subordinate','Contact','Unknown'];
function renderPartyOverview(){
  const host = el('partyOverview'); if(!host) return;
  const active = state.characters.filter(c=>c.state==='active');
  if(!active.length){ host.innerHTML='<div class="dm-empty">No active party members.</div>'; return; }
  host.innerHTML = active.map(c=>{
    const rk = rankOf(c);
    const cls = getClassDef(c.playerClass);
    const hpPct = c.hp.max>0?clamp(c.hp.current/c.hp.max*100,0,100):0;
    const mpPct = c.mana.max>0?clamp(c.mana.current/c.mana.max*100,0,100):0;
    const hpColor = hpPct>50?'#4ade80':hpPct>25?'#e8a72c':'#d94f4f';
    return `
    <div class="po-card">
      <div class="po-head">
        <span class="po-rank" style="color:${rk.color}">${rk.id}</span>
        <span class="po-name">${esc(c.name||'Unknown')}</span>
        <span class="po-class">${cls?`${cls.icon} ${cls.label}`:'No Class'}</span>
        <span class="po-level">Lv.${c.systemLevel||1}</span>
      </div>
      <div class="po-bars">
        <div class="po-bar-row"><span class="po-bar-label" style="color:${hpColor}">HP</span><div class="po-bar-track"><div class="po-bar-fill" style="width:${hpPct}%;background:${hpColor}"></div></div><span class="po-bar-val">${c.hp.current}/${c.hp.max}</span></div>
        <div class="po-bar-row"><span class="po-bar-label" style="color:#4a8bf5">MP</span><div class="po-bar-track"><div class="po-bar-fill" style="width:${mpPct}%;background:#4a8bf5"></div></div><span class="po-bar-val">${c.mana.current}/${c.mana.max}</span></div>
      </div>
      <div class="po-stats">${['STR','DEX','CON','INT','WIS','CHA'].map(s=>`<span class="po-stat">${s} ${effectiveStat(c,s)}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

function renderRelationships(){
  const c = getChar();
  const host = el('relationshipsList'); if(!host) return;
  if(!Array.isArray(c.relationships)) c.relationships=[];
  if(!c.relationships.length){ host.innerHTML = `<div class="empty-note">No party contacts recorded.</div>`; return; }
  host.innerHTML = c.relationships.map((r,i)=>`
    <div class="rel-card">
      <div class="rel-head">
        <input class="rel-name" data-i="${i}" value="${esc(r.name||'')}" placeholder="Name">
        <select class="rel-type" data-i="${i}">${REL_TYPES.map(t=>`<option ${r.type===t?'selected':''}>${t}</option>`).join('')}</select>
        <button class="rel-del" data-i="${i}">✕</button>
      </div>
      <textarea class="rel-notes" data-i="${i}" placeholder="Dossier notes…">${esc(r.notes||'')}</textarea>
    </div>`).join('');
  host.querySelectorAll('.rel-name').forEach(inp=> inp.addEventListener('input',()=>{ c.relationships[+inp.dataset.i].name=inp.value; pushState(); }));
  host.querySelectorAll('.rel-notes').forEach(inp=> inp.addEventListener('input',()=>{ c.relationships[+inp.dataset.i].notes=inp.value; pushState(); }));
  host.querySelectorAll('.rel-type').forEach(s=> s.addEventListener('change',()=>{ c.relationships[+s.dataset.i].type=s.value; pushState(true); }));
  host.querySelectorAll('.rel-del').forEach(b=> b.addEventListener('click',()=>{ c.relationships.splice(+b.dataset.i,1); pushState(true); renderRelationships(); }));
}
function addRelationship(){ const c=getChar(); if(!Array.isArray(c.relationships))c.relationships=[]; c.relationships.push({name:'',type:'Colleague',notes:''}); pushState(true); renderRelationships(); }

// ================================================================
// MONSTER LOG (Tower bestiary)
// ================================================================
// ── ANOMALY LOG (player view) ──
// Player sees TWO sections:
//   1. FILED — anomalies granted to their character (view-only)
//   2. AVAILABLE — catalog entries NOT yet granted, each with a purchase
//      button that costs HALF the threat grade's bounty in Points.
// Legacy no-op — creation is now DM-only via the catalog manager
// ================================================================

// ================================================================
// PERSONAL SYSTEMS + CLASS SKILL INTEGRITY
// ================================================================
const PERSONAL_SYSTEM_TYPES = {
  none:{name:'No Personal System',icon:'◇'},
  chaos:{name:'Chaos Gacha System',icon:'✦'},
  quest:{name:'Quest System',icon:'▤'},
  training:{name:'Training System',icon:'▲'}
};

// Direct class evolutions. Their class package supersedes the old package;
// genuinely different evolved skills remain as additional class skills.
const CLASS_EVOLUTIONS = {
  knight:'magic_knight',
  sorcerer:'arch_mage',
  priest:'high_priest',
  ranger:'beast_master',
  assassin:'shadow_assassin',
  berserker:'brutal_berserker',
  necromancer:'lich_lord',
  paladin:'saint'
};
const CLASS_SKILL_REPLACEMENTS = {
  magic_knight:{'Swordsmanship':'Mana Blade','Shield Bash':'Spell Parry'},
  arch_mage:{'Arcane Bolt':'Mana Overflow','Mana Shield':'Reality Warp'},
  high_priest:{'Holy Light':'Mass Resurrection','Blessing':'Divine Aegis'},
  beast_master:{"Quick Shot":'Tame Monster',"Nature's Mark":'Pack Tactics'},
  shadow_assassin:{'Backstab':'Shadow Kill','Shadow Step':'Vanish'},
  brutal_berserker:{'Rage':'Rampage','Cleave':'Bloodlust'},
  lich_lord:{'Raise Dead':'Army of the Dead','Life Drain':'Soul Cage'},
  saint:{'Divine Smite':'Miracle','Lay on Hands':'Aura of Salvation'}
};
function abilityKey(a){ return String(a?.name||'').trim().toLowerCase(); }
function classFamilyFor(classId){
  for(const [base,evo] of Object.entries(CLASS_EVOLUTIONS)) if(classId===base || classId===evo) return {base,evo};
  return {base:classId,evo:null};
}
function syncClassSkills(c){
  if(!c || !Array.isArray(c.abilities)) return;
  const classId=String(c.playerClass||'none');
  if(classId==='none') return;

  const fam=classFamilyFor(classId);
  const activeDefs=CLASS_BASIC_SKILLS[classId] || getClassDef(classId)?.skills || [];
  const baseDefs=CLASS_BASIC_SKILLS[fam.base] || [];
  const replacementMap=CLASS_SKILL_REPLACEMENTS[classId] || {};

  // Remove obsolete locked skills from a previous class family, but preserve
  // manually learned / stone / system abilities.
  c.abilities = c.abilities.filter(a=>{
    if(!a?.locked || a?.source!=='class') return true;
    if(a.classId===classId) return true;
    if(a.classId===fam.base && classId===fam.evo) return false;
    if(a.classId===fam.evo && classId===fam.base) return false;
    return false;
  });

  const desired=[];
  activeDefs.forEach(sk=>desired.push({...sk,source:'class',classId,locked:true}));
  // If an evolved class does not explicitly replace a basic skill, keep it.
  if(classId===fam.evo){
    const replacedOld=new Set(Object.keys(replacementMap).map(x=>x.toLowerCase()));
    baseDefs.forEach(sk=>{
      if(!replacedOld.has(String(sk.name||'').toLowerCase()) &&
         !desired.some(x=>abilityKey(x)===abilityKey(sk))){
        desired.push({...sk,source:'class',classId:fam.base,locked:true});
      }
    });
  }
  desired.forEach(sk=>{
    const key=abilityKey(sk);
    const existing=c.abilities.find(a=>abilityKey(a)===key);
    if(existing){
      if(existing.source==='class'){
        Object.assign(existing,sk,{source:'class',locked:true,classId:sk.classId||classId});
      }
    }else{
      c.abilities.push({...sk});
    }
  });
}
function chaosSlotInfo(c){
  const ps=ensurePersonalSystem(c).chaos;
  ps.abilitySlots=1; // design rule: exactly one Chaos Ability can be active/equipped.
  ps.traits=Array.isArray(ps.traits)?ps.traits:[];
  ps.items=Array.isArray(ps.items)?ps.items:[];
  ps.skills=Array.isArray(ps.skills)?ps.skills:[];
  ps.abilities=Array.isArray(ps.abilities)?ps.abilities:[];

  // Give every recorded ability a stable id so equipping survives Firebase/local saves.
  ps.abilities=ps.abilities.map((a,i)=>{
    if(typeof a==='string') return {id:`chaos-${Date.now()}-${i}`,name:a,desc:''};
    if(!a.id) a.id=`chaos-${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`;
    return a;
  });

  // If the equipped ability was deleted or is from an older build, safely unequip it.
  if(ps.equippedAbilityId && !ps.abilities.some(a=>String(a.id)===String(ps.equippedAbilityId))){
    ps.equippedAbilityId='';
  }
  const equipped=ps.abilities.find(a=>String(a.id)===String(ps.equippedAbilityId)) || null;
  return {learned:ps.abilities.length,slots:1,equipped};
}
function ensurePersonalSystem(c){
  if(!c.personalSystem) c.personalSystem=blankChar(99).personalSystem;
  return c.personalSystem;
}
function renderPersonalSystem(){
  const host=el('personalSystemHost'); if(!host) return;
  const c=getChar(), ps=ensurePersonalSystem(c), def=PERSONAL_SYSTEM_TYPES[ps.type]||PERSONAL_SYSTEM_TYPES.none;
  if(ps.type==='none'){
    host.innerHTML=`<section class="system-shell empty-system"><div class="system-sigil">◇</div><h2>NO SYSTEM ATTACHED</h2><p>This character has not been assigned a personal System by the Game Master.</p></section>`;
    return;
  }
  let body='';
  if(ps.type==='chaos'){
    const info=chaosSlotInfo(c);
    const normalSection=(title,key,icon)=>`<div class="sys-collection"><div class="sys-collection-head"><span>${icon} ${title}</span><b>${(ps.chaos[key]||[]).length}</b></div>${(ps.chaos[key]||[]).length?(ps.chaos[key]||[]).map(x=>`<div class="sys-chip"><strong>${esc(x.name||x)}</strong>${x.desc?`<span>${esc(x.desc)}</span>`:''}</div>`).join(''):'<div class="sys-muted">Nothing rolled yet.</div>'}</div>`;
    const abilities=(ps.chaos.abilities||[]);
    const abilitySection=`<div class="sys-collection chaos-ability-vault"><div class="sys-collection-head"><span>✦ ABILITY VAULT</span><b>${abilities.length} OWNED · 1 ACTIVE</b></div>
      ${abilities.length?abilities.map(a=>{
        const equipped=String(ps.chaos.equippedAbilityId||'')===String(a.id);
        return `<div class="sys-chip chaos-ability ${equipped?'is-equipped':''}">
          <div class="chaos-ability-copy"><strong>${esc(a.name||'Unnamed Ability')}</strong>${a.desc?`<span>${esc(a.desc)}</span>`:''}</div>
          <button class="chaos-equip-btn ${equipped?'active':''}" data-chaos-equip="${esc(String(a.id))}">${equipped?'ACTIVE':'EQUIP'}</button>
        </div>`;
      }).join(''):'<div class="sys-muted">No abilities have been added yet.</div>'}
    </div>`;
    body=`<div class="chaos-slot-banner">
        <div><span>ACTIVE ABILITY SLOTS</span><strong>1 / 1</strong></div>
        <div><span>ABILITIES OWNED</span><strong>${info.learned}</strong></div>
        <div><span>CURRENT ACTIVE</span><strong>${info.equipped?esc(info.equipped.name||'Unnamed Ability'):'NONE'}</strong></div>
      </div>
      <div class="system-rule chaos-rule"><b>CHAOS GACHA RULE</b><p>Traits, Skills, Items and Abilities can be collected without a limit. Only one Ability can be equipped and active at a time.</p></div>
      <div class="sys-grid">${normalSection('Traits','traits','✧')}${normalSection('Skills','skills','◆')}${normalSection('Items','items','◈')}${abilitySection}</div>`;
  } else if(ps.type==='quest'){
    const personal=(state.cases||[]).filter(q=>q.assignedTo==='all' ? false : (Array.isArray(q.assignedTo)&&q.assignedTo.includes(String(c.id))));
    body=`<div class="quest-system-banner"><div><span>QUEST COMPLEXITY</span><strong>LEVEL ${ps.quest.complexityLevel}</strong></div><div><span>PERSONAL QUESTS</span><strong>${personal.length}</strong></div></div>
      ${ps.quest.requirementNotes?`<div class="system-rule"><b>SYSTEM REQUIREMENTS</b><p>${esc(ps.quest.requirementNotes)}</p></div>`:''}
      <div class="system-quest-stack">${personal.length?personal.map(q=>`<article class="system-quest-card"><header><b>${esc(q.name)}</b><span>${esc(q.rank||'E')}</span></header><p>${esc(q.desc||'')}</p>${(q.requirements||[]).length?`<div class="sys-reqs">${q.requirements.map(r=>`<span>◇ ${esc(r)}</span>`).join('')}</div>`:''}</article>`).join(''):'<div class="sys-muted">No System quests assigned.</div>'}</div>`;
  } else if(ps.type==='training'){
    const ups=ps.training.upgrades||[];
    body=`<div class="training-bank"><span>TRAINING POINTS</span><strong>${ps.training.points}</strong><small>Spend these on a specific attack or skill. Each upgrade is tracked separately.</small></div>
      <div class="training-upgrades">${ups.length?ups.map(u=>`<div class="training-row"><div><strong>${esc(u.name||'Unnamed Technique')}</strong><span>${esc(u.kind||'Attack')}</span></div><b>+${Number(u.bonus)||0} DAMAGE</b><small>${Number(u.spent)||0} TP SPENT</small></div>`).join(''):'<div class="sys-muted">No techniques have been trained yet.</div>'}</div>`;
  }
  host.innerHTML=`<section class="system-shell type-${ps.type}"><header class="system-hero"><div class="system-sigil">${def.icon}</div><div><span>PERSONAL SYSTEM</span><h2>${esc(ps.name||def.name)}</h2><p>${esc(ps.description||'A unique System bound to this player.')}</p></div></header>${body}</section>`;
  if(ps.type==='chaos'){
    host.querySelectorAll('[data-chaos-equip]').forEach(btn=>btn.addEventListener('click',()=>{
      if(!canEdit()){ showToast('This System is read-only for you.','warn'); return; }
      const id=String(btn.dataset.chaosEquip||'');
      // Clicking the active ability unequips it; choosing another automatically replaces it.
      ps.chaos.equippedAbilityId=String(ps.chaos.equippedAbilityId||'')===id?'':id;
      pushState(true);
      renderPersonalSystem();
    }));
  }
}
function dmSystemManagerHtml(charOpts){
  return `<div class="dm-card dm-system-manager"><div class="dm-card-title">◈ Attach Personal System</div><div class="dm-card-body">
    <div class="dm-system-toolbar"><select id="dmSystemTarget">${charOpts}</select><select id="dmSystemType"><option value="none">No System</option><option value="chaos">Chaos Gacha</option><option value="quest">Quest System</option><option value="training">Training System</option></select><button class="maw-btn small" id="dmSystemAttach">ATTACH / UPDATE</button></div>
    <input id="dmSystemName" placeholder="Custom System name (optional)"><textarea id="dmSystemDesc" rows="2" placeholder="System description / rules"></textarea>
  </div></div>
  <div class="dm-card"><div class="dm-card-title">✦ System Record Editor</div><div class="dm-card-body" id="dmSystemEditor"><div class="dm-empty">Select a player to manage their System.</div></div></div>`;
}
function renderDmSystemEditor(){
  const host=el('dmSystemEditor'), sel=el('dmSystemTarget'); if(!host||!sel) return;
  const c=state.characters[Number(sel.value)]; if(!c) return;
  const ps=ensurePersonalSystem(c);
  if(el('dmSystemType')) el('dmSystemType').value=ps.type;
  if(el('dmSystemName')) el('dmSystemName').value=ps.name||'';
  if(el('dmSystemDesc')) el('dmSystemDesc').value=ps.description||'';
  if(ps.type==='chaos'){
    const info=chaosSlotInfo(c);
    host.innerHTML=`<div class="dm-system-summary"><b>${esc(c.name||'Player')}</b><span>Unlimited collection · ${info.learned} abilities owned · exactly 1 active slot</span></div>
      <div class="dm-chaos-add"><select id="dmChaosKind"><option value="traits">Trait</option><option value="skills">Skill</option><option value="items">Item</option><option value="abilities">Ability</option></select><input id="dmChaosName" placeholder="Name"><input id="dmChaosDesc" placeholder="Effect / description"><button class="maw-btn small" id="dmChaosAdd">＋ ADD</button></div>
      <div class="dm-system-records">${['traits','skills','items','abilities'].map(k=>`<section class="${k==='abilities'?'dm-chaos-abilities':''}"><h4>${k.toUpperCase()} <span>${(ps.chaos[k]||[]).length}</span></h4>${(ps.chaos[k]||[]).map((x,i)=>{
        const active=k==='abilities' && String(ps.chaos.equippedAbilityId||'')===String(x.id||'');
        return `<div class="dm-system-record ${active?'is-equipped':''}"><div><b>${esc(x.name||x)}</b><span>${esc(x.desc||'')}</span></div><div class="dm-record-actions">${k==='abilities'?`<button class="dm-equip-ability ${active?'active':''}" data-dm-chaos-equip="${esc(String(x.id||''))}">${active?'ACTIVE':'EQUIP'}</button>`:''}<button data-sysdel="${k}" data-i="${i}">✕</button></div></div>`;
      }).join('')||'<div class="dm-empty">Empty</div>'}</section>`).join('')}</div>`;
    el('dmChaosAdd')?.addEventListener('click',async()=>{
      const kindEl=el('dmChaosKind'), nameEl=el('dmChaosName'), descEl=el('dmChaosDesc');
      const k=kindEl?.value, n=nameEl?.value.trim();
      if(!k || !['traits','skills','items','abilities'].includes(k)){ showToast('Choose a valid Chaos Gacha category.','warn'); return; }
      if(!n){ showToast('Give the entry a name first.','warn'); nameEl?.focus(); return; }

      // Mutate the actual character-owned collection first so the entry appears instantly.
      const entry={id:`chaos-${Date.now()}-${Math.random().toString(16).slice(2)}`,name:n,desc:descEl?.value.trim()||''};
      if(!Array.isArray(ps.chaos[k])) ps.chaos[k]=[];
      ps.chaos[k].push(entry);
      chaosSlotInfo(c);

      // Render immediately from local state, then persist. A stale remote snapshot
      // is blocked by the pending-write guard above.
      renderDmSystemEditor();
      const newKind=el('dmChaosKind'); if(newKind) newKind.value=k;
      showToast(`${k.slice(0,-1).toUpperCase()} ADDED: ${n}`,'ok');
      await pushState(true);
    });
    host.querySelectorAll('[data-dm-chaos-equip]').forEach(b=>b.addEventListener('click',()=>{
      const id=String(b.dataset.dmChaosEquip||'');
      ps.chaos.equippedAbilityId=String(ps.chaos.equippedAbilityId||'')===id?'':id;
      pushState(true); renderDmSystemEditor();
    }));
  }else if(ps.type==='quest'){
    host.innerHTML=`<div class="dm-system-summary"><b>${esc(c.name||'Player')}</b><span>Quest System configuration</span></div>
      <label class="dm-field-label">Complexity Level<input type="number" id="dmQuestComplexity" min="1" value="${ps.quest.complexityLevel}"></label>
      <label class="dm-field-label">Standing Requirements<textarea id="dmQuestReqNotes" rows="3" placeholder="Rules applied to this player's quests">${esc(ps.quest.requirementNotes)}</textarea></label>
      <button class="maw-btn small" id="dmQuestSystemSave">SAVE QUEST SYSTEM</button>`;
    el('dmQuestSystemSave')?.addEventListener('click',()=>{ ps.quest.complexityLevel=Math.max(1,+el('dmQuestComplexity').value||1); ps.quest.requirementNotes=el('dmQuestReqNotes').value; pushState(true); renderDmSystemEditor(); });
  }else if(ps.type==='training'){
    host.innerHTML=`<div class="dm-system-summary"><b>${esc(c.name||'Player')}</b><span>${ps.training.points} Training Points available</span></div>
      <div class="dm-training-bank"><input type="number" id="dmTrainingGrant" min="0" value="1"><button class="maw-btn small" id="dmTrainingGrantBtn">＋ GRANT TP</button></div>
      <div class="dm-chaos-add"><input id="dmTrainingName" placeholder="Attack / Skill"><select id="dmTrainingKind"><option>Attack</option><option>Skill</option><option>Spell</option></select><input type="number" id="dmTrainingCost" min="1" value="1" title="TP cost"><input type="number" id="dmTrainingDamage" min="1" value="1" title="Damage gained"><button class="maw-btn small" id="dmTrainingSpend">UPGRADE</button></div>
      <div class="dm-system-records one">${(ps.training.upgrades||[]).map((u,i)=>`<div class="dm-system-record"><div><b>${esc(u.name)}</b><span>${esc(u.kind)} · +${u.bonus} damage · ${u.spent} TP spent</span></div><button data-trainingdel="${i}">✕</button></div>`).join('')||'<div class="dm-empty">No upgrades.</div>'}</div>`;
    el('dmTrainingGrantBtn')?.addEventListener('click',()=>{ ps.training.points+=Math.max(0,+el('dmTrainingGrant').value||0); pushState(true); renderDmSystemEditor(); });
    el('dmTrainingSpend')?.addEventListener('click',()=>{ const cost=Math.max(1,+el('dmTrainingCost').value||1),name=el('dmTrainingName').value.trim(); if(!name||ps.training.points<cost){showToast('Not enough Training Points or no technique selected.','warn');return;} const dmg=Math.max(1,+el('dmTrainingDamage').value||1); let u=ps.training.upgrades.find(x=>x.name.toLowerCase()===name.toLowerCase()); if(!u){u={name,kind:el('dmTrainingKind').value,bonus:0,spent:0};ps.training.upgrades.push(u);} u.bonus+=dmg;u.spent+=cost;ps.training.points-=cost;pushState(true);renderDmSystemEditor(); });
  }else host.innerHTML='<div class="dm-empty">Attach a System to this player first.</div>';
  host.querySelectorAll('[data-sysdel]').forEach(b=>b.addEventListener('click',()=>{
    const key=b.dataset.sysdel, idx=+b.dataset.i, removed=ps.chaos[key]?.[idx];
    if(key==='abilities' && removed && String(ps.chaos.equippedAbilityId||'')===String(removed.id||'')) ps.chaos.equippedAbilityId='';
    ps.chaos[key].splice(idx,1); pushState(true); renderDmSystemEditor();
  }));
  host.querySelectorAll('[data-trainingdel]').forEach(b=>b.addEventListener('click',()=>{ps.training.upgrades.splice(+b.dataset.trainingdel,1);pushState(true);renderDmSystemEditor();}));
}

// ABILITIES / TALENTS
// ================================================================
const TALENT_TYPES = ['Active','Passive','Combat','Utility','Ultimate','Ritual'];
function renderAbilities(){
  const c = getChar();
  syncClassSkills(c);
  const host = el('abilitiesList'); if(!host) return;
  if(!Array.isArray(c.abilities)) c.abilities=[];
  const cnt = el('talentCount'); if(cnt) cnt.textContent = `${c.abilities.length} LEARNED`;
  if(!c.abilities.length){
    host.innerHTML = `<div class="empty-note big">✶<br>NO SKILLS LEARNED<br><span>Gain skills by receiving a class at Level 10 or by absorbing Skill Stones.</span></div>`;
    return;
  }
  host.innerHTML = c.abilities.map((a,i)=>{
    const type = a.type||'Active';
    return `
    <div class="talent-card type-${type.toLowerCase()} ${a.source==='class'?'class-locked':''}">
      <div class="talent-head">
        <span class="talent-type-badge">${esc(type)}</span>
        ${a.source==='class'?`<span class="class-skill-source">◆ ${esc(getClassDef(a.classId)?.label||'CLASS')} CORE</span>`:''}
        <input class="ab-name" data-i="${i}" value="${esc(a.name||'')}" placeholder="Skill name" ${a.locked?'readonly':''}>
        <button class="ab-del" data-i="${i}" title="${a.locked?'Core class skills cannot be removed':'Remove'}" ${a.locked?'disabled':''}>✕</button>
      </div>
      <div class="talent-meta">
        <label><span>Type</span>
          <select class="ab-type" data-i="${i}">${TALENT_TYPES.map(t=>`<option ${a.type===t?'selected':''}>${t}</option>`).join('')}</select>
        </label>
        <label><span>Cost</span><input class="ab-cost" data-i="${i}" value="${esc(a.cost||'')}" placeholder="e.g. 30 MP"></label>
        <label><span>Cooldown</span><input class="ab-cooldown" data-i="${i}" value="${esc(a.cooldown||'')}" placeholder="e.g. 3 rounds"></label>
      </div>
      <textarea class="ab-desc" data-i="${i}" placeholder="What it does, how it works…">${esc(a.desc||'')}</textarea>
    </div>`;
  }).join('');
  // text fields: live-update state on input, FLUSH to server on blur (prevents data loss on leave)
  const wire = (sel,key)=> host.querySelectorAll(sel).forEach(inp=>{
    inp.addEventListener('input',()=>{ c.abilities[+inp.dataset.i][key]=inp.value; pushState(); });
    inp.addEventListener('blur', flushPendingPush);
  });
  wire('.ab-name','name'); wire('.ab-cost','cost'); wire('.ab-cooldown','cooldown'); wire('.ab-desc','desc');
  host.querySelectorAll('.ab-type').forEach(s=> s.addEventListener('change',()=>{ c.abilities[+s.dataset.i].type=s.value; pushState(true); renderAbilities(); }));
  host.querySelectorAll('.ab-del').forEach(b=> b.addEventListener('click',()=>{ if(confirm('Remove this talent?')){ c.abilities.splice(+b.dataset.i,1); pushState(true); renderAbilities(); } }));
}
function addAbility(){ const c=getChar(); if(!Array.isArray(c.abilities))c.abilities=[]; c.abilities.push({name:'',type:'Talent',cost:'',cooldown:'',desc:''}); pushState(true); renderAbilities(); }

// ================================================================
// DM PANEL
// ================================================================
// Target picker in the DM console header — shows every character,
// active selection glows, click switches the DM's focus.
function renderDmTargetPicker(){
  const sel = el('dmTargetPicker'); if(!sel) return;
  const cur = state.selectedCharacter;
  sel.innerHTML = state.characters.map((c,i) => {
    const rk = rankOf(c);
    const st = c.state === 'dead' ? ' · Dead' : c.state === 'reserve' ? ' · Reserve' : '';
    return `<option value="${i}" ${i===cur?'selected':''}>${esc(c.name || `Player ${i+1}`)} — ${rk.id}${st}</option>`;
  }).join('');
  // Rebind handler each call — sel.onchange doesn't stack
  sel.onchange = e => {
    state.selectedCharacter = Number(e.target.value) || 0;
    pushState(true);
    render();
  };
}

// Focus guard: don't re-render the DM roster while the DM is typing in it.
// This prevents Firebase snapshots from yanking focus out of input fields.
let _dmFocused = false;

function renderDmPanel(){
  if(!dmUnlocked) return;
  if(_dmFocused) return;
  let roster = el('dmRoster');

  // The GM overlay is built on demand. Normal character renders can happen
  // while that overlay is closed, so a missing roster is not an error.
  // If the overlay is actually open but its dynamic body has not been built
  // yet, rebuild it once and then continue.
  if(!roster){
    const overlay = el('dmOverlay');
    const content = el('dmContent');
    const overlayOpen = !!overlay && !overlay.classList.contains('hidden');

    if(overlayOpen && content){
      buildDmPanelHtml();
      roster = el('dmRoster');
    }

    if(!roster) return;
  }

  const chars = state.characters;
  if(!chars || !chars.length){ roster.innerHTML = '<div class="dm-empty">No characters. Click + Player to add one.</div>'; return; }
  if(roster){
    roster.innerHTML = state.characters.map((c,i)=>{
      const rk = rankOf(c);
      const st = c.state||'active';
      return `
      <div class="dm-agent state-${st} ${i===state.selectedCharacter?'sel':''}">
        <div class="dm-agent-top">
          <button class="dm-agent-pick" data-i="${i}">${esc(c.name||`Player ${i+1}`)}</button>
          <span class="dm-agent-rank" style="color:${rk.color}">${rk.tier} · ${rk.title}</span>
          <span class="dm-agent-state-tag ${st}">${st==='active'?'ACTIVE':st==='reserve'?'RESERVE':'DEAD'}</span>
        </div>
        <div class="dm-agent-controls">
          <label class="dm-mini"><span>Rank</span>
            <select class="dm-rank" data-i="${i}">${RANKS.map(r=>`<option value="${r.id}" ${c.rank===r.id?'selected':''}>${r.id} · ${r.title}</option>`).join('')}</select>
          </label>
          <label class="dm-mini"><span>Class ${(Number(c.systemLevel)||1)<10?'(Sys.10)':''}</span>
            <select class="dm-class" data-i="${i}" ${(Number(c.systemLevel)||1)<10?'disabled':''}>
              <option value="none" ${c.playerClass==='none'?'selected':''}>— No Class —</option>
              <optgroup label="Base Classes">
                ${PLAYER_CLASSES.filter(pc=>!pc.hidden).map(pc=>`<option value="${pc.id}" ${c.playerClass===pc.id?'selected':''}>${pc.icon} ${pc.label}</option>`).join('')}
              </optgroup>
              <optgroup label="★ Advanced Classes">
                ${PLAYER_CLASSES.filter(pc=>pc.hidden).map(pc=>`<option value="${pc.id}" ${c.playerClass===pc.id?'selected':''}>${pc.icon} ${pc.label}</option>`).join('')}
              </optgroup>
              ${(state.customClasses||[]).length ? `<optgroup label="✦ Custom Classes">
                ${(state.customClasses||[]).map(pc=>`<option value="${pc.id}" ${c.playerClass===pc.id?'selected':''}>${pc.icon||'✦'} ${pc.label}</option>`).join('')}
              </optgroup>` : ''}
            </select>
          </label>
          <label class="dm-mini"><span>Gold</span>
            <input class="dm-points" data-i="${i}" type="number" value="${c.points||0}">
          </label>
          <label class="dm-mini"><span>Stat Pts</span>
            <input class="dm-basepts" data-i="${i}" type="number" value="${c.baseStatPoints||9}" min="0">
          </label>
          <label class="dm-mini"><span>Status</span>
            <select class="dm-state" data-i="${i}">
              <option value="active" ${st==='active'?'selected':''}>Active</option>
              <option value="reserve" ${st==='reserve'?'selected':''}>Reserve</option>
              <option value="dead" ${st==='dead'?'selected':''}>Dead</option>
            </select>
          </label>
        </div>
        <div class="dm-agent-actions">
          <span class="dm-pts-display">${fmtGold(c.points)} gold</span>
          <button class="dm-agent-reserve" data-i="${i}" title="Toggle reserve">${st==='reserve'?'⟲ Reinstate':'⇩ To Reserve'}</button>
          <button class="dm-agent-del" data-i="${i}" title="Terminate record">✕ Delete</button>
        </div>
      </div>`;
    }).join('');
    roster.querySelectorAll('.dm-agent-pick').forEach(b=> b.addEventListener('click',()=>{ state.selectedCharacter=+b.dataset.i; render(); }));
    roster.querySelectorAll('.dm-rank').forEach(s=> s.addEventListener('change',()=>{ state.characters[+s.dataset.i].rank=s.value; pushState(true); render(); }));
    roster.querySelectorAll('.dm-class').forEach(s=> s.addEventListener('change',()=>{
      const c = state.characters[+s.dataset.i];
      const oldClass = c.playerClass;
      const nextClass = String(s.value || 'none');
      c.playerClass = nextClass;

      // Auto-grant any starter skills the first time this specific class is assigned.
      // This also works for custom classes after reload because their skills are now
      // persisted inside state.customClasses and rehydrated into CLASS_BASIC_SKILLS.
      if(nextClass !== 'none' && oldClass !== nextClass){
        const basics = CLASS_BASIC_SKILLS[nextClass] || getClassDef(nextClass)?.skills || [];
        basics.forEach(skill => {
          // Only add if they don't already have a skill with this name
          const exists = c.abilities.some(a => a.name === skill.name);
          if(!exists){
            c.abilities.push({
              name: skill.name,
              type: skill.type,
              cost: skill.cost,
              cooldown: skill.cooldown,
              desc: skill.desc + ' [Class Skill]'
            });
          }
        });
        const cls = getClassDef(nextClass);
        showToast(`${c.name||'Player'} is now a ${cls?.label||nextClass}!${basics.length?` Granted: ${basics.map(b=>b.name).join(', ')}`:''}`, 'buy');
      } else if(nextClass !== 'none' && oldClass !== nextClass){
        showToast(`${c.name||'Player'}'s class changed to ${getClassDef(nextClass)?.label||nextClass}`, 'info');
      }

      // Immediate write so the GM assignment cannot be lost behind a debounce.
      pushState(true);
      render();
    }));
    roster.querySelectorAll('.dm-points').forEach(inp=> inp.addEventListener('input',()=>{ state.characters[+inp.dataset.i].points=Math.max(0,Number(inp.value)||0); pushState(); renderHeader(); }));
    roster.querySelectorAll('.dm-basepts').forEach(inp=> inp.addEventListener('input',()=>{
      state.characters[+inp.dataset.i].baseStatPoints = Math.max(0, Number(inp.value)||0);
      pushState(); render();
    }));
    roster.querySelectorAll('.dm-state').forEach(s=> s.addEventListener('change',()=>{ state.characters[+s.dataset.i].state=s.value; pushState(true); render(); }));
    roster.querySelectorAll('.dm-agent-reserve').forEach(b=> b.addEventListener('click',()=>{ const c=state.characters[+b.dataset.i]; c.state = c.state==='reserve'?'active':'reserve'; pushState(true); render(); showToast(c.state==='reserve'?`${c.name||'Agent'} moved to reserve`:`${c.name||'Agent'} reinstated`,'info'); }));
    roster.querySelectorAll('.dm-agent-del').forEach(b=> b.addEventListener('click',()=> dmDeleteAgent(+b.dataset.i)));
  }

  // Mission point award by threat grade
  const award = el('dmAwardGrades');
  if(award){
    award.innerHTML = THREAT_GRADES.map(t=>`
      <button class="grade-btn" data-grade="${t.grade}" style="--gc:${t.color}">
        <span class="grade-letter">${t.grade}</span>
        <span class="grade-pts">${fmtGold(t.points)}${t.grade==='S'?'+':''}</span>
        <span class="grade-label">${t.label}</span>
      </button>`).join('');
    award.querySelectorAll('.grade-btn').forEach(b=> b.addEventListener('click',()=> awardMissionPoints(b.dataset.grade)));
  }


  // Title management
  el('dmTitleCreateBtn')?.addEventListener('click', ()=>{
    const name=el('dmTitleName')?.value?.trim();
    if(!name){ showToast('Give the title a name','warn'); return; }
    if((state.titleCatalog||[]).some(t=>t.name.toLowerCase()===name.toLowerCase())){
      showToast('A title with that name already exists','warn'); return;
    }
    if(!Array.isArray(state.titleCatalog)) state.titleCatalog=[];
    state.titleCatalog.push({
      id:'title-'+Date.now()+'-'+Math.random().toString(16).slice(2,6),
      name,
      rarity:el('dmTitleRarity')?.value||'common',
      desc:el('dmTitleDesc')?.value||'',
      passive:el('dmTitlePassive')?.value||'',
      color:el('dmTitleColor')?.value||'#77bfff'
    });
    pushState(true);
    showToast(`♛ Title "${name}" created`,'buy');
    buildDmPanelHtml(); renderDmPanel();
  });

  function dmTitleTargetChar(){
    const idx=Number(el('dmTitleTarget')?.value);
    return state.characters[idx]||null;
  }
  el('dmTitleGrantBtn')?.addEventListener('click',()=>{
    const c=dmTitleTargetChar(), name=el('dmTitleSelect')?.value;
    if(!c||!name) return;
    ensureCharacterTitles(c);
    if(!c.titles.includes(name)) c.titles.push(name);
    pushState(true); render(); renderDmTitleOwnership(); renderDmTitleCatalog();
    showToast(`Granted "${name}" to ${c.name||'Player'}`,'buy');
  });
  el('dmTitleEquipBtn')?.addEventListener('click',()=>{
    const c=dmTitleTargetChar(), name=el('dmTitleSelect')?.value;
    if(!c||!name) return;
    ensureCharacterTitles(c);
    if(!c.titles.includes(name)) c.titles.push(name);
    c.title=name;
    pushState(true); render(); renderDmTitleOwnership();
    showToast(`${c.name||'Player'} equipped "${name}"`,'info');
  });
  el('dmTitleRevokeBtn')?.addEventListener('click',()=>{
    const c=dmTitleTargetChar(), name=el('dmTitleSelect')?.value;
    if(!c||!name) return;
    ensureCharacterTitles(c);
    c.titles=c.titles.filter(t=>t!==name);
    if(c.title===name) c.title='';
    pushState(true); render(); renderDmTitleOwnership(); renderDmTitleCatalog();
    showToast(`Revoked "${name}" from ${c.name||'Player'}`,'warn');
  });
  el('dmTitleTarget')?.addEventListener('change',renderDmTitleOwnership);

  renderDmTitleCatalog();
  renderDmTitleOwnership();

  // Shop management

  // New systems
  try{ renderDmCommendations(); }catch(e){}
  try{ renderDmRequests(); }catch(e){}
  try{ syncSiteAlertButtons(); }catch(e){}

  try{ renderDmSites(); }catch(e){}


  try{ renderDmOpsParty(); }catch(e){}
  try{ renderDmDiagnostics(); }catch(e){}
  el('dmAddSiteBtn')?.addEventListener('click', addSite);
  el('dmAddCaseBtn')?.addEventListener('click', addCase);
}


function renderDmOpsParty(){
  const host=el('dmOpsParty'); if(!host) return;
  const chars=(state.characters||[]).filter(c=>c.state!=='dead');
  host.innerHTML=chars.map((c)=>{
    const idx=state.characters.indexOf(c);
    const hpPct=c.hp?.max?clamp((c.hp.current/c.hp.max)*100,0,100):0;
    const mpPct=c.mana?.max?clamp((c.mana.current/c.mana.max)*100,0,100):0;
    const rk=rankOf(c);
    const critical=hpPct<=25;
    return `<button class="dm-vital-card ${critical?'critical':''}" data-i="${idx}">
      <div class="dm-vital-head"><span style="color:${rk.color}">${rk.id}</span><strong>${esc(c.name||`Player ${idx+1}`)}</strong><em>${esc(c.state||'active')}</em></div>
      <div class="dm-vital-line"><span>HP</span><div><i class="hp" style="width:${hpPct}%"></i></div><b>${c.hp?.current||0}/${c.hp?.max||0}</b></div>
      <div class="dm-vital-line"><span>MP</span><div><i class="mp" style="width:${mpPct}%"></i></div><b>${c.mana?.current||0}/${c.mana?.max||0}</b></div>
    </button>`;
  }).join('');
  host.querySelectorAll('.dm-vital-card').forEach(b=>b.addEventListener('click',()=>{
    const idx=Number(b.dataset.i); state.selectedCharacter=idx;
    const target=el('dmActionTarget'); if(target) target.value=String(idx);
    render(); renderDmPanel();
  }));
}

// ═════════════════════════════════════════════════════════════════
// DM ANOMALY CATALOG — master list, grants access to specific agents
// Players see granted files in their Anomaly Log tab, and can purchase
// ungranted ones at half the threat grade's bounty.
// ═════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════
// SCENE BANNER — current site indicator at top of every terminal
// ═════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════
// DM · SITE LOCATOR
// ═════════════════════════════════════════════════════════════════
let _dmSiteSelectedId = null;
function dmActiveSite(){
  const list = state.sites || [];
  if (!list.length) return null;
  let s = list.find(x => x.id === _dmSiteSelectedId);
  if (!s) { s = list[0]; _dmSiteSelectedId = s.id; }
  return s;
}
function addSite(){
  if(!Array.isArray(state.sites)) state.sites = [];
  const s = {
    id: 'site-' + Date.now(),
    name: 'New Site', designation: '', region: 'urban',
    description: '', atmosphere: '', contaminated: false,
    dmNotes: '', current: false
  };
  state.sites.push(s);
  _dmSiteSelectedId = s.id;
  pushState(true); renderDmSites();
}
function renderDmSites(){
  const host = el('dmSitesRoot'); if(!host) return;
  const list = state.sites || [];
  const cur = dmActiveSite();

  host.innerHTML = `
    <div class="dm-site-shell">
      <aside class="dm-site-side">
        ${list.length ? list.map(s => {
          const on = cur && s.id === cur.id;
          return `<button type="button" class="dm-site-row ${on?'active':''} ${s.current?'scene':''}" data-siteid="${esc(s.id)}">
            <span class="dm-site-dot ${s.current?'on':''}"></span>
            <span class="dm-site-info">
              <span class="dm-site-name">${esc(s.name)}</span>
              <span class="dm-site-sub">${esc(s.region)}${s.current?' · <b>CURRENT</b>':''}</span>
            </span>
          </button>`;
        }).join('') : '<div class="dm-empty" style="padding:1rem">No sites registered.</div>'}
      </aside>
      <div class="dm-site-main">
        ${cur ? `
          <div class="dm-site-head">
            <label class="dm-site-field" style="flex:1"><span>Name</span>
              <input type="text" id="dmSiteName" value="${esc(cur.name)}" placeholder="Site name">
            </label>
            <label class="dm-site-field" style="width:140px"><span>Designation</span>
              <input type="text" id="dmSiteDesig" value="${esc(cur.designation)}" placeholder="SITE-██">
            </label>
            <label class="dm-site-field" style="width:130px"><span>Region</span>
              <select id="dmSiteRegion">
                ${['urban','rural','forest','coastal','underground','industrial','remote','anomalous'].map(r =>
                  `<option value="${r}" ${cur.region===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`
                ).join('')}
              </select>
            </label>
            <div class="dm-site-actions">
              <button class="dt-btn small ${cur.current?'':'ghost'}" id="dmSiteScene">
                ${cur.current?'✓ Current Scene':'Set as Scene'}
              </button>
              <button class="dt-btn ghost small" id="dmSiteDel">🗑</button>
            </div>
          </div>
          <label class="dm-site-field">
            <span>Description (players see this)</span>
            <textarea id="dmSiteDesc" placeholder="What is this place? What history does it have?">${esc(cur.description)}</textarea>
          </label>
          <label class="dm-site-field">
            <span>Atmosphere (banner tagline)</span>
            <input type="text" id="dmSiteAtmos" value="${esc(cur.atmosphere)}" placeholder="e.g. thick fog, distant screams, sterile silence">
          </label>
          <label class="dm-site-toggle ${cur.contaminated?'on':''}">
            <input type="checkbox" id="dmSiteContam" ${cur.contaminated?'checked':''}>
            <span class="dm-site-toggle-icon">⚠</span>
            <span class="dm-site-toggle-text">
              <b>Contamination Alert</b>
              <em>Marks the site with a warning stripe on all agent terminals</em>
            </span>
          </label>
          <label class="dm-site-field">
            <span>DM notes (private)</span>
            <textarea id="dmSiteNotes" class="dm-site-private" placeholder="Only DMs see this. Secrets, encounters lurking here, plot hooks…">${esc(cur.dmNotes)}</textarea>
          </label>
        ` : `<div class="dm-empty" style="padding:2rem">Register a site to begin.</div>`}
      </div>
    </div>
  `;

  host.querySelectorAll('.dm-site-row').forEach(r => r.addEventListener('click', () => {
    _dmSiteSelectedId = r.dataset.siteid; renderDmSites();
  }));
  el('dmSiteScene')?.addEventListener('click', () => {
    const c = dmActiveSite(); if(!c) return;
    const wasCurrent = c.current;
    state.sites.forEach(s => s.current = false);
    c.current = !wasCurrent;
    showToast(c.current ? `Scene: ${c.name}` : 'No current scene', 'success');
  });
  el('dmSiteDel')?.addEventListener('click', () => {
    const c = dmActiveSite(); if(!c) return;
    if (!confirm(`Remove site "${c.name}"?`)) return;
    state.sites = state.sites.filter(x => x.id !== c.id);
    _dmSiteSelectedId = null;
  });
  el('dmSiteContam')?.addEventListener('change', e => {
    const c = dmActiveSite(); if(!c) return;
    c.contaminated = e.target.checked;
  });
  const bind = (id, field) => el(id)?.addEventListener('input', e => {
    const c = dmActiveSite(); if(!c) return;
    c[field] = e.target.value; pushState();
    if (['name','region','contaminated'].includes(field)) renderDmSites();
  });
  bind('dmSiteName','name'); bind('dmSiteDesig','designation');
  bind('dmSiteDesc','description'); bind('dmSiteAtmos','atmosphere');
  bind('dmSiteNotes','dmNotes');
  el('dmSiteRegion')?.addEventListener('change', e => {
    const c = dmActiveSite(); if(!c) return;
  });
}

// ═════════════════════════════════════════════════════════════════
// DM · INVESTIGATION CASES
// ═════════════════════════════════════════════════════════════════
let _dmCaseSelectedId = null;
// ═════════════════════════════════════════════════════════════════
// QUEST LOG — player-side quest display
// ═════════════════════════════════════════════════════════════════
function renderQuestLog(){
  const c = getChar(); if(!c) return;
  const host = el('questList'); if(!host) return;
  const visibleToCharacter = q =>
    q.assignedTo === 'all' ||
    (Array.isArray(q.assignedTo) && q.assignedTo.includes(String(c.id))) ||
    (!q.assignedTo || (Array.isArray(q.assignedTo) && q.assignedTo.length===0));
  const quests = (state.cases || []).filter(q =>
    visibleToCharacter(q) && q.status !== 'completed' && q.status !== 'failed'
  );

  const statsEl = el('questStats');
  if(statsEl){
    const active = (state.cases||[]).filter(q=>q.status==='active').length;
    const available = (state.cases||[]).filter(q=>q.status==='available').length;
    const completed = (state.cases||[]).filter(q=>q.status==='completed').length;
    statsEl.innerHTML = `<span class="qstat"><strong>${active}</strong> Active</span><span class="qstat"><strong>${available}</strong> Available</span><span class="qstat completed"><strong>${completed}</strong> Completed</span>`;
  }

  const filterEl = el('questFilters');
  if(filterEl){
    filterEl.innerHTML = `<button class="quest-type-filter active" data-qtype="all">All</button>` +
      Object.entries(QUEST_TYPES).map(([k,v])=>`<button class="quest-type-filter" data-qtype="${k}" style="--qt-c:${v.color}">${v.icon} ${v.label}</button>`).join('');
    filterEl.querySelectorAll('.quest-type-filter').forEach(btn=>{
      btn.addEventListener('click',()=>{
        filterEl.querySelectorAll('.quest-type-filter').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const t = btn.dataset.qtype;
        host.querySelectorAll('.quest-card').forEach(card=>{ card.style.display = (t==='all'||card.dataset.qtype===t)?'':'none'; });
      });
    });
  }

  if(!quests.length){
    host.innerHTML = `<div class="empty-note big">📜<br>NO ACTIVE QUESTS<br><span>The Game Master assigns quests from the GM Console.</span></div>`;
    return;
  }

  const rankOrder = {S:0,A:1,B:2,C:3,D:4,E:5};
  quests.sort((a,b)=>{ if(a.status==='active'&&b.status!=='active')return-1; if(b.status==='active'&&a.status!=='active')return 1; return(rankOrder[a.rank]||5)-(rankOrder[b.rank]||5); });

  host.innerHTML = quests.map(q=>{
    const qt = QUEST_TYPES[q.type] || QUEST_TYPES.side;
    const rk = RANK_BY_ID[q.rank] || RANKS[0];
    const doneCt = (q.objectives||[]).filter(o=>o.done).length;
    const totCt = (q.objectives||[]).length;
    const pct = totCt > 0 ? Math.round(doneCt/totCt*100) : 0;
    return `
    <div class="quest-card ${q.status}" data-qtype="${q.type}" style="--qt-c:${qt.color};--qr-c:${rk.color}">
      <div class="qc-head">
        <span class="qc-type" style="color:${qt.color}">${qt.icon}</span>
        <span class="qc-name">${esc(q.name)}</span>
        <span class="qc-rank" style="color:${rk.color};border-color:${rk.color}">${rk.id}</span>
        <span class="qc-status-tag ${q.status}">${q.status.toUpperCase()}</span>
      </div>
      ${q.desc?`<div class="qc-desc">${esc(q.desc)}</div>`:''}
      ${(q.requirements||[]).length?`<div class="qc-requirements"><span>REQUIREMENTS</span>${q.requirements.map(r=>`<b>◇ ${esc(r)}</b>`).join('')}</div>`:''}
      ${totCt?`
        <div class="qc-progress"><div class="qc-progress-bar"><div class="qc-progress-fill" style="width:${pct}%"></div></div><span class="qc-progress-text">${doneCt}/${totCt}</span></div>
        <div class="qc-objectives">${q.objectives.map(o=>`<div class="qc-obj ${o.done?'done':''}"><span class="qc-obj-check">${o.done?'✓':'○'}</span><span>${esc(o.text)}</span></div>`).join('')}</div>
      `:''}
      ${(q.rewards.exp||q.rewards.gold||(q.rewards.items||[]).length)?`
        <div class="qc-rewards"><span class="qc-rewards-label">REWARDS:</span>
          ${q.rewards.exp?`<span class="qc-reward exp">✦ ${fmtGold(q.rewards.exp)} EXP</span>`:''}
          ${q.rewards.gold?`<span class="qc-reward gold">◆ ${fmtGold(q.rewards.gold)} Gold</span>`:''}
          ${(q.rewards.items||[]).map(it=>{const r=typeof it==='object'?it:{name:String(it),qty:1};const si=findTowerShopItem(r.name);return `<span class="qc-reward item" title="${esc(si?.desc||'')}">${esc(si?.icon||'📦')} ${esc(r.name)}${(Number(r.qty)||1)>1?` ×${Number(r.qty)||1}`:''}</span>`;}).join('')}
        </div>`:''}
      ${q.timeLimit?`<div class="qc-time">⏱ ${esc(q.timeLimit)}</div>`:''}
    </div>`;
  }).join('');

  el('questShowCompleted')?.addEventListener('click',()=>{
    const list = el('questCompletedList'); if(!list) return;
    const showing = list.style.display !== 'none';
    list.style.display = showing ? 'none' : '';
    el('questShowCompleted').textContent = showing ? 'Show Completed' : 'Hide Completed';
    if(!showing){
      const completed = (state.cases||[]).filter(q=>q.status==='completed'||q.status==='failed');
      list.innerHTML = completed.length ? completed.map(q=>{
        const qt = QUEST_TYPES[q.type]||QUEST_TYPES.side;
        return `<div class="quest-card completed-card ${q.status}"><div class="qc-head"><span class="qc-type" style="color:${qt.color}">${qt.icon}</span><span class="qc-name">${esc(q.name)}</span><span class="qc-status-tag ${q.status}">${q.status.toUpperCase()}</span></div></div>`;
      }).join('') : '<div class="empty-note">No completed quests yet.</div>';
    }
  });
}

// ═════════════════════════════════════════════════════════════════
// DM · QUEST LIST RENDERER (used in GM Console → Quests tab)
// ═════════════════════════════════════════════════════════════════
function renderDmQuestList(){
  const host = el('dmQuestList'); if(!host) return;
  const quests = state.cases || [];
  if(!quests.length){ host.innerHTML='<div class="dm-empty">No quests created yet.</div>'; return; }

  host.innerHTML = quests.map((q,i) => {
    const qt = QUEST_TYPES[q.type] || QUEST_TYPES.side;
    const rk = RANK_BY_ID[q.rank] || RANKS[0];
    const doneCt = (q.objectives||[]).filter(o=>o.done).length;
    const totCt = (q.objectives||[]).length;
    const pct = totCt > 0 ? Math.round(doneCt/totCt*100) : 0;
    return `
    <div class="dm-quest-row" style="--qt-c:${qt.color}">
      <div class="dm-quest-top">
        <span style="color:${qt.color};font-size:1rem">${qt.icon}</span>
        <strong>${esc(q.name)}</strong>
        <span class="dm-quest-rank" style="color:${rk.color}">${rk.id}</span>
        <select class="dm-quest-status" data-qi="${i}">
          <option value="available" ${q.status==='available'?'selected':''}>Available</option>
          <option value="active" ${q.status==='active'?'selected':''}>Active</option>
          <option value="completed" ${q.status==='completed'?'selected':''}>Completed</option>
          <option value="failed" ${q.status==='failed'?'selected':''}>Failed</option>
        </select>
        <button class="dm-quest-del" data-qi="${i}" title="Delete">✕</button>
      </div>
      ${q.desc ? `<div style="font-size:.72rem;color:var(--text-dim);margin:.3rem 0 .2rem;padding-left:1.5rem">${esc(q.desc)}</div>` : ''}
      ${totCt ? `
        <div style="display:flex;align-items:center;gap:.5rem;margin:.3rem 0 .2rem;padding-left:1.5rem">
          <div style="flex:1;height:4px;background:rgba(0,0,0,.4);border-radius:2px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${qt.color};border-radius:2px;transition:width .3s"></div>
          </div>
          <span style="font-family:var(--F4);font-size:.48rem;color:var(--text-dim)">${doneCt}/${totCt}</span>
        </div>
        <div class="dm-quest-objs">${q.objectives.map((o,oi)=>`
          <label class="dm-quest-obj"><input type="checkbox" ${o.done?'checked':''} data-qi="${i}" data-oi="${oi}"> ${esc(o.text)}</label>
        `).join('')}</div>
      ` : ''}
      ${(q.rewards.exp||q.rewards.gold||q.rewards.items?.length) ? `
        <div class="dm-quest-rewards">
          Rewards: ${q.rewards.exp?`✦ ${fmtGold(q.rewards.exp)} EXP `:''}${q.rewards.gold?`◆ ${fmtGold(q.rewards.gold)} Gold `:''}${(q.rewards.items||[]).map(it=>{const r=typeof it==='object'?it:{name:String(it),qty:1};return `📦 ${esc(r.name)}${(Number(r.qty)||1)>1?` ×${Number(r.qty)||1}`:''}`;}).join(' ')}
        </div>
      ` : ''}
    </div>`;
  }).join('');

  // Wire status changes
  host.querySelectorAll('.dm-quest-status').forEach(sel=>sel.addEventListener('change',()=>{
    const q = state.cases[+sel.dataset.qi]; if(!q) return;
    const oldStatus = q.status;
    q.status = sel.value;
    // Auto-grant rewards on completion. Assignment is respected and a quest pays out only once.
    if(sel.value === 'completed' && oldStatus !== 'completed' && !q.rewardsGranted){
      const targets = q.assignedTo==='all'
        ? state.characters.filter(c=>c.state==='active')
        : state.characters.filter(c=>Array.isArray(q.assignedTo) && q.assignedTo.includes(c.id));
      const rewardItems=Array.isArray(q.rewards?.items)?q.rewards.items:[];
      targets.forEach(c=>{
        if(q.rewards.exp) gainExp(c, q.rewards.exp);
        if(q.rewards.gold) c.points = (c.points||0) + q.rewards.gold;
        rewardItems.forEach(raw=>{
          const r=raw&&typeof raw==='object'?raw:{name:String(raw||''),qty:1};
          if(r.name) giveTowerShopItem(c,r.name,Math.max(1,Number(r.qty)||1),'quest',q.name);
        });
      });
      q.rewardsGranted=true;
      const itemSummary=rewardItems.map(raw=>{const r=raw&&typeof raw==='object'?raw:{name:String(raw||''),qty:1};return `${r.name}${(Number(r.qty)||1)>1?' ×'+(Number(r.qty)||1):''}`;}).filter(Boolean).join(', ');
      showToast(`Quest "${q.name}" completed!${itemSummary?' Items: '+itemSummary:''}`, 'buy');
    }
    pushState(true); render(); renderDmQuestList();
  }));

  // Wire objective checkboxes
  host.querySelectorAll('.dm-quest-obj input').forEach(cb=>cb.addEventListener('change',()=>{
    const q = state.cases[+cb.dataset.qi]; if(!q) return;
    const obj = q.objectives[+cb.dataset.oi]; if(!obj) return;
    obj.done = cb.checked;
    pushState(true); renderDmQuestList();
  }));

  // Wire delete
  host.querySelectorAll('.dm-quest-del').forEach(btn=>btn.addEventListener('click',()=>{
    const q = state.cases[+btn.dataset.qi];
    if(!confirm(`Delete quest "${q?.name||'Untitled'}"?`)) return;
    state.cases.splice(+btn.dataset.qi, 1);
    pushState(true); renderDmQuestList();
    showToast('Quest deleted','info');
  }));
}

// ── DM CHARACTER MANAGEMENT ──
function dmDeleteAgent(i){
  const c = state.characters[i]; if(!c) return;
  if(state.characters.length<=1){ showToast('Cannot delete the last player','warn'); return; }
  if(!confirm(`DELETE player record for ${c.name||`Player ${i+1}`}?\n\nThis permanently deletes the character for everyone.`)) return;
  state.characters.splice(i,1);
  if(state.selectedCharacter>=state.characters.length) state.selectedCharacter = state.characters.length-1;
  pushState(true); render();
  showToast(`Record terminated: ${c.name||'Agent'}`,'warn');
}
function dmAddAgent(){
  const nc = blankChar(state.characters.length);
  nc.state = 'reserve';
  state.characters.push(nc);
  state.selectedCharacter = state.characters.length-1;
  state.showReserve = true;
  pushState(true); render();
  showToast('New player created (Reserve)','buy');
}

// ================================================================
// RESOURCE ADJUST (HP / Mana / Points quick buttons)
// ================================================================
function adjustResource(resource, amt){
  const c = getChar();
  if(resource==='hp'){ c.hp.current = clamp((c.hp.current||0)+amt, 0, c.hp.max); }
  else if(resource==='mana'){ c.mana.current = clamp((c.mana.current||0)+amt, 0, c.mana.max); }
  else if(resource==='points'){ c.points = Math.max(0,(Number(c.points)||0)+amt); }
  ensureClamp(c); pushState(true); renderMainFields(); renderHeader();
  if(resource==='mana') applyManaDamage();
}

// ================================================================
// TOASTS
// ================================================================
let _toastTimer = null;
function showToast(msg, kind='info', dur=3200){
  let t = el('toastEl');
  if(!t){ t=document.createElement('div'); t.id='toastEl'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast show '+kind;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>{ t.className='toast '+kind; }, dur);
}

// ================================================================
// BROADCAST — full-screen eerie takeover, pushed by the DM
// ================================================================
let _broadcastUnsub = null;
let _lastBroadcastTs = 0;

async function sendBroadcast(msg){
  if(!dmUnlocked) return;
  try { await setDoc(doc(db,'dt-meta','broadcast'), { msg, ts:Date.now(), cleared:false }); }
  catch(e){ console.error(e); }
}
async function clearBroadcast(){
  try { await setDoc(doc(db,'dt-meta','broadcast'), { msg:'', ts:Date.now(), cleared:true }); }
  catch(e){ console.error(e); }
}
function startBroadcastListener(){
  if(_broadcastUnsub) _broadcastUnsub();
  const _loadTime = Date.now();
  _broadcastUnsub = onSnapshot(doc(db,'dt-meta','broadcast'), snap=>{
    if(!snap.exists()) return;
    const d = snap.data();
    if(d.ts && d.ts > _lastBroadcastTs){
      _lastBroadcastTs = d.ts;
      if(d.cleared || !d.msg){ removeBroadcastScreen(); return; }
      // Don't let a stale broadcast (sent long before this page loaded) ambush a new visitor.
      // Only auto-show broadcasts that are fresh (within 2h) OR sent after we loaded.
      const age = Date.now() - d.ts;
      const isFresh = age < 2*60*60*1000;          // under 2 hours old
      const sentAfterLoad = d.ts >= _loadTime - 5000;
      if(isFresh || sentAfterLoad) showBroadcastScreen(d.msg);
    }
  }, ()=>{});
}
function removeBroadcastScreen(){ el('broadcastScreen')?.remove(); }
function showBroadcastScreen(msg){
  const alreadyShowing = !!el('broadcastScreen');
  removeBroadcastScreen();
  const ov = document.createElement('div');
  ov.id = 'broadcastScreen';
  ov.className = alreadyShowing ? 'broadcast-screen no-intro' : 'broadcast-screen';
  const canDismiss = dmUnlocked;
  ov.innerHTML = `
    <div class="bcs-noise"></div>
    <div class="bcs-scan"></div>
    <div class="bcs-vignette"></div>
    ${canDismiss ? `
    <div class="bcs-pin">
      <span class="bcs-pin-label">ADMIN CONTROLS</span>
      <button class="bcs-pin-edit" id="bcsPinEdit" title="Jump to editor">✎ EDIT</button>
      <button class="bcs-pin-end" id="bcsPinEnd" title="End the transmission for everyone">▣ END</button>
    </div>` : ''}
    <div class="bcs-scroll">
      <div class="bcs-inner">
        <div class="bcs-head">
          <span class="bcs-dot"></span>
          <span class="bcs-channel">DUNGEON TOWER · SYSTEM BROADCAST</span>
          <span class="bcs-dot"></span>
        </div>
        <div class="bcs-tag">// PRIORITY TRANSMISSION //</div>
        <div class="bcs-message" id="bcsMessage"></div>
        <div class="bcs-foot">
          <span>THIS MESSAGE IS MANDATORY VIEWING</span>
          <span class="bcs-id">REF ${Math.random().toString(36).slice(2,8).toUpperCase()}-${new Date().getFullYear()}</span>
        </div>
        ${canDismiss ? `
        <div class="bcs-dm-bar" id="bcsDmBar">
          <textarea class="bcs-dm-input" id="bcsDmInput" placeholder="Amend or extend the transmission… (this replaces the message on every screen)"></textarea>
          <div class="bcs-dm-actions">
            <button class="bcs-dm-update" id="bcsUpdate">⟳ UPDATE MESSAGE</button>
            <button class="bcs-dm-append" id="bcsAppend">＋ APPEND LINE</button>
            <button class="bcs-dismiss" id="bcsDismiss">▣ END TRANSMISSION</button>
          </div>
        </div>` : `
        <div class="bcs-wait">AWAITING CLEARANCE FROM ADMINISTRATOR…</div>
        <button class="bcs-admin-login" id="bcsAdminLogin">⚿ ADMINISTRATOR OVERRIDE</button>`}
      </div>
    </div>`;
  document.body.appendChild(ov);
  // typewriter reveal for eerie effect
  const target = el('bcsMessage');
  const text = String(msg);
  let idx = 0;
  target.classList.add('typing');
  const tick = ()=>{
    if(idx<=text.length){ target.textContent = text.slice(0,idx); idx++; setTimeout(tick, 34); }
    else { target.classList.remove('typing'); }
  };
  tick();
  // pre-fill the DM editor with the current message so they can edit in place
  const dmInput = el('bcsDmInput');
  if(dmInput) dmInput.value = text;
  el('bcsUpdate')?.addEventListener('click', ()=>{
    const v = el('bcsDmInput')?.value.trim();
    if(!v){ showToast('Message is empty','warn'); return; }
    sendBroadcast(v);   // re-broadcast → all screens (incl. this one) re-render via snapshot
    showToast('Transmission updated','info');
  });
  el('bcsAppend')?.addEventListener('click', ()=>{
    const extra = el('bcsDmInput')?.value.trim();
    if(!extra){ showToast('Nothing to append','warn'); return; }
    const current = el('bcsMessage')?.textContent || '';
    const combined = current ? (current + '\n' + extra) : extra;
    sendBroadcast(combined);
    if(el('bcsDmInput')) el('bcsDmInput').value = combined;
    showToast('Line appended to transmission','info');
  });
  el('bcsDismiss')?.addEventListener('click', ()=>{ clearBroadcast(); removeBroadcastScreen(); });
  // Always-visible pinned controls
  el('bcsPinEnd')?.addEventListener('click', ()=>{ clearBroadcast(); removeBroadcastScreen(); });
  el('bcsPinEdit')?.addEventListener('click', ()=>{
    const bar = el('bcsDmBar');
    bar?.scrollIntoView({ behavior:'smooth', block:'center' });
    el('bcsDmInput')?.focus();
  });
  // Non-DM: administrator override — log in as DM right from the broadcast screen
  el('bcsAdminLogin')?.addEventListener('click', ()=>{
    const pass = prompt('Administrator access code:');
    if(pass===null) return;
    if(pass !== DM_PASS){ showToast('Access denied','warn'); return; }
    dmUnlocked = true; sessionStorage.setItem('dt-dm','1');
    render();
    // re-render the broadcast screen so DM controls now appear
    showBroadcastScreen(el('bcsMessage')?.textContent || msg);
    showToast('Administrator access granted','buy');
  });
}

// ================================================================
// SOUND DESIGN — subtle terminal SFX (Web Audio, no asset files)
// ================================================================
let _audioCtx = null;
let _sfxEnabled = localStorage.getItem('dt-sfx') !== '0';
function _ac(){
  if(_sfxEnabled===false) return null;
  if(!_audioCtx){ try{ _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } }
  if(_audioCtx.state==='suspended') _audioCtx.resume().catch(()=>{});
  return _audioCtx;
}
// generic tone
function _tone(freq, dur, type='square', vol=0.04, when=0){
  const ac=_ac(); if(!ac) return;
  const t=ac.currentTime+when;
  const o=ac.createOscillator(), g=ac.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(vol,t+0.005);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t+dur+0.02);
}
const SFX = {
  key(){ _tone(420+Math.random()*120, 0.03, 'square', 0.018); },      // typewriter keystroke
  click(){ _tone(880, 0.04, 'square', 0.03); _tone(1320,0.03,'square',0.015,0.01); },
  tab(){ _tone(600, 0.05, 'triangle', 0.03); },
  confirm(){ _tone(660,0.06,'square',0.035); _tone(990,0.08,'square',0.03,0.06); },
  warn(){ _tone(220,0.12,'sawtooth',0.04); _tone(180,0.18,'sawtooth',0.035,0.08); },
  alarm(){ const ac=_ac(); if(!ac) return; for(let i=0;i<3;i++){ _tone(740,0.18,'square',0.05,i*0.42); _tone(560,0.18,'square',0.05,i*0.42+0.2);} },
  hum(){ _tone(70,1.4,'sine',0.06); _tone(105,1.4,'sine',0.03); },
  buy(){ _tone(523,0.05,'square',0.03); _tone(784,0.06,'square',0.03,0.05); _tone(1046,0.1,'square',0.03,0.11); }
};
function toggleSfx(){
  _sfxEnabled = !_sfxEnabled;
  localStorage.setItem('dt-sfx', _sfxEnabled?'1':'0');
  const b=el('sfxToggle'); if(b){ b.classList.toggle('off',!_sfxEnabled); b.textContent = _sfxEnabled?'♪ SFX':'♪ SFX OFF'; }
  if(_sfxEnabled){ SFX.click(); startAmbient(); } else { stopAmbient(); }
  showToast(_sfxEnabled?'Audio enabled':'Audio muted','info');
}

let _ambient = null;
function startAmbient(){
  const ac = _ac(); if(!ac) return;
  if(_ambient) return;
  const master = ac.createGain(); master.gain.value = 0.0; master.connect(ac.destination);
  const oscA = ac.createOscillator(); oscA.type='sine'; oscA.frequency.value=55;
  const oscB = ac.createOscillator(); oscB.type='sine'; oscB.frequency.value=82.5;
  const oscC = ac.createOscillator(); oscC.type='triangle'; oscC.frequency.value=110;
  const gA = ac.createGain(); gA.gain.value=0.5;
  const gB = ac.createGain(); gB.gain.value=0.3;
  const gC = ac.createGain(); gC.gain.value=0.0;
  const lfo = ac.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.08;
  const lfoGain = ac.createGain(); lfoGain.gain.value=6;
  lfo.connect(lfoGain); lfoGain.connect(oscA.frequency);
  oscA.connect(gA); oscB.connect(gB); oscC.connect(gC);
  gA.connect(master); gB.connect(master); gC.connect(master);
  oscA.start(); oscB.start(); oscC.start(); lfo.start();
  master.gain.linearRampToValueAtTime(0.05, ac.currentTime+3);
  _ambient = { master, oscA, oscB, oscC, gC, lfo, ac };
  updateAmbient();
}
function stopAmbient(){
  if(!_ambient) return;
  const { master, oscA, oscB, oscC, lfo, ac } = _ambient;
  try {
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.linearRampToValueAtTime(0.0001, ac.currentTime+1.2);
    [oscA,oscB,oscC,lfo].forEach(o=>{ try{ o.stop(ac.currentTime+1.3); }catch(e){} });
  } catch(e){}
  _ambient = null;
}
function updateAmbient(){
  if(!_ambient) return;
  const c = getChar();
  const hpPct = c.hp.max>0 ? c.hp.current/c.hp.max : 1;
  const sanPct = c.mana.max>0 ? c.mana.current/c.mana.max : 1;
  const low = Math.min(hpPct, sanPct);
  const ac = _ambient.ac;
  const tension = 1 - low;
  try {
    _ambient.gC.gain.linearRampToValueAtTime(0.04 + tension*0.16, ac.currentTime+1.5);
    _ambient.lfo.frequency.linearRampToValueAtTime(0.08 + tension*0.5, ac.currentTime+1.5);
    const dissonance = state.siteAlert==='uncontained' ? 4 : (state.siteAlert==='lockdown' ? 2 : 0);
    _ambient.oscB.frequency.linearRampToValueAtTime(82.5 + dissonance, ac.currentTime+1.5);
  } catch(e){}
}

let _heartbeat = null;
function applyHeartbeat(){
  const c = getChar();
  const hpPct = c.hp.max>0 ? c.hp.current/c.hp.max : 1;
  const critical = c.hp.max>0 && hpPct>0 && hpPct<=0.25;
  if(critical && !_heartbeat){
    document.body.classList.add('heartbeat-active');
    const beat = ()=>{
      pulseHeartbeatVisual();
      if(_sfxEnabled) heartbeatSound();
      const rate = hpPctRate();
      _heartbeat = setTimeout(beat, rate);
    };
    beat();
  } else if(!critical && _heartbeat){
    clearTimeout(_heartbeat); _heartbeat=null;
    document.body.classList.remove('heartbeat-active');
  }
}
function hpPctRate(){
  const c = getChar();
  const hpPct = c.hp.max>0 ? c.hp.current/c.hp.max : 1;
  return 600 + Math.max(0, hpPct/0.25) * 600;
}
function pulseHeartbeatVisual(){
  let o = el('heartbeatOverlay');
  if(!o){ o=document.createElement('div'); o.id='heartbeatOverlay'; document.body.appendChild(o); }
  o.classList.remove('thump'); void o.offsetWidth; o.classList.add('thump');
}
function heartbeatSound(){
  const ac=_ac(); if(!ac) return;
  const t=ac.currentTime;
  const thump=(when)=>{
    const o=ac.createOscillator(), g=ac.createGain();
    o.type='sine'; o.frequency.setValueAtTime(64,when); o.frequency.exponentialRampToValueAtTime(36,when+0.12);
    g.gain.setValueAtTime(0.0,when); g.gain.linearRampToValueAtTime(0.09,when+0.01); g.gain.exponentialRampToValueAtTime(0.0001,when+0.18);
    o.connect(g); g.connect(ac.destination); o.start(when); o.stop(when+0.2);
  };
  thump(t); thump(t+0.16);
}

let _knockUnsub = null;
let _knockLoadTs = Date.now();
async function sendKnock(){
  const c = getChar();
  const who = c.name || 'An agent';
  try {
    await setDoc(doc(db,'dt-meta','knock'), { by:who, ts:Date.now() });
    SFX.confirm();
    showToast('Signal sent to the Administrator','info');
  } catch(e){ showToast('Could not send signal','warn'); }
}
function startKnockListener(){
  if(_knockUnsub) _knockUnsub();
  _knockUnsub = onSnapshot(doc(db,'dt-meta','knock'), snap=>{
    if(!snap.exists()) return;
    const d = snap.data();
    if(!d.ts || d.ts <= _knockLoadTs) return;
    _knockLoadTs = d.ts;
    if(dmUnlocked) showKnockAlert(d.by||'An agent');
  }, ()=>{});
}
function showKnockAlert(who){
  const a=document.createElement('div');
  a.className='knock-alert';
  a.innerHTML=`<span class="knock-icon">✋</span><span class="knock-text"><strong>${esc(who)}</strong> is requesting your attention</span>`;
  document.body.appendChild(a);
  if(_sfxEnabled){ SFX.tab(); setTimeout(()=>SFX.tab(),180); }
  setTimeout(()=>{ a.classList.add('out'); setTimeout(()=>a.remove(),400); }, 5000);
}

// ================================================================
// DYNAMIC SITE STATE — normal / lockdown / uncontained
// ================================================================
function setSiteAlert(level){
  if(!dmUnlocked) return;
  state.siteAlert = level;
  showToast(`Site status: ${level.toUpperCase()}`, level==='normal'?'info':'warn');
}

// ================================================================
// IDLE CORRUPTION — subtle glitches creep in when the sheet sits idle
// ================================================================
let _idleTimer = null;
let _corruptionLevel = 0;
let _corruptionTick = null;
function resetIdle(){
  _corruptionLevel = 0;
  document.body.classList.remove('corrupt-1','corrupt-2','corrupt-3');
  el('corruptionOverlay')?.classList.remove('active');
  clearTimeout(_idleTimer);
  clearInterval(_corruptionTick);
  _idleTimer = setTimeout(beginCorruption, 90000); // 90s of inactivity
}
function beginCorruption(){
  if(!el('corruptionOverlay')){
    const o=document.createElement('div'); o.id='corruptionOverlay'; o.innerHTML='<div class="corrupt-scan"></div><div class="corrupt-glitch"></div>';
    document.body.appendChild(o);
  }
  el('corruptionOverlay').classList.add('active');
  _corruptionTick = setInterval(()=>{
    _corruptionLevel = Math.min(3, _corruptionLevel+1);
    document.body.classList.remove('corrupt-1','corrupt-2','corrupt-3');
    document.body.classList.add('corrupt-'+_corruptionLevel);
    if(_corruptionLevel>=2 && Math.random()<0.5) SFX.hum();
  }, 45000); // deepens every 45s of continued idle
}

// ================================================================
// LOW-SANITY SCREEN DAMAGE — the whole screen degrades as mana falls
// Tied to the character you're viewing/controlling. Four bands:
//   >50% none · 50-30% level1 · 30-15% level2 · <15% level3 (critical)
// ================================================================
let _manaBand = 0;
let _manaWhisperTimer = null;
function applyManaDamage(){
  const c = getChar();
  const max = Number(c?.mana?.max)||0;
  const cur = Number(c?.mana?.current)||0;
  const pct = max>0 ? (cur/max)*100 : 100;   // no max set = treat as stable
  let band = 0;
  if(max>0){
    if(pct<=15) band = 3;
    else if(pct<=30) band = 2;
    else if(pct<=50) band = 1;
  }
  if(band === _manaBand){ ensureManaOverlay(band); return; }
  const rising = band > _manaBand;
  _manaBand = band;
  document.body.classList.remove('mana-1','mana-2','mana-3');
  ensureManaOverlay(band);
  if(band>0){
    document.body.classList.add('mana-'+band);
    if(rising){
      // sensory sting when it gets worse
      if(band>=2) SFX?.warn?.();
      if(band>=3){ SFX?.alarm?.(); startManaWhispers(); }
    }
  }
  if(band<3) stopManaWhispers();
}
function ensureManaOverlay(band){
  let o = el('manaOverlay');
  if(band<=0){ o?.remove(); return; }
  if(!o){
    o = document.createElement('div');
    o.id = 'manaOverlay';
    o.innerHTML = `
      <div class="san-vignette"></div>
      <div class="san-grain"></div>
      <div class="san-scan"></div>
      <div class="san-rgb"></div>
      <div class="san-cracks"></div>
      <div class="san-pulse"></div>`;
    document.body.appendChild(o);
  }
  o.className = 'san-band-'+band;
}
// faint distorted "whispers" at critical mana (synthesized, no audio files)
function startManaWhispers(){
  if(_sfxEnabled===false) return;
  stopManaWhispers();
  const whisper = ()=>{
    const ac = _ac(); if(!ac){ return; }
    // breathy noise burst through a bandpass — sounds like a distant voice
    const dur = 0.5 + Math.random()*0.6;
    const buf = ac.createBuffer(1, ac.sampleRate*dur, ac.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++){ d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 1.5); }
    const src = ac.createBufferSource(); src.buffer = buf;
    const bp = ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=600+Math.random()*700; bp.Q.value=6;
    const g = ac.createGain(); g.gain.value=0.05;
    src.connect(bp); bp.connect(g); g.connect(ac.destination);
    src.start();
  };
  _manaWhisperTimer = setInterval(()=>{ if(Math.random()<0.6) whisper(); }, 4000);
}
function stopManaWhispers(){ clearInterval(_manaWhisperTimer); _manaWhisperTimer=null; }

// ================================================================
// COMMENDATIONS / ACHIEVEMENTS
// ================================================================
// ═════════════════════════════════════════════════════════════════
// SKILL STONES — items that can be absorbed into permanent skills
// DM creates and awards them. Players can absorb or transfer.
// ═════════════════════════════════════════════════════════════════
function renderSkillStones(){
  const host = el('skillStonesList'); if(!host) return;
  const c = getChar();
  const stones = c.skillStones || [];
  if(!stones.length){
    host.innerHTML = `<div class="empty-note">No Skill Stones held. The Game Master awards these as dungeon rewards.</div>`;
    return;
  }
  const otherPlayers = state.characters.filter(x => x.id !== c.id && x.state === 'active' && x.name);
  host.innerHTML = stones.map((s, i) => `
    <div class="ss-card" style="--ss-color:${s.element ? getElementColor(s.element) : '#5ee7ff'}">
      <div class="ss-head">
        <span class="ss-gem">💎</span>
        <span class="ss-name">${esc(s.name)}</span>
        <span class="ss-type-badge">${esc(s.type)}</span>
        ${s.element ? `<span class="ss-element">${esc(s.element)}</span>` : ''}
      </div>
      <div class="ss-meta">
        ${s.cost && s.cost !== '—' ? `<span>Cost: ${esc(s.cost)}</span>` : ''}
        ${s.cooldown && s.cooldown !== '—' ? `<span>CD: ${esc(s.cooldown)}</span>` : ''}
        ${s.fromDm ? '<span class="ss-from">From: GM</span>' : ''}
        ${s.fromPlayer ? `<span class="ss-from">From: ${esc(s.fromPlayer)}</span>` : ''}
      </div>
      ${s.desc ? `<div class="ss-desc">${esc(s.desc)}</div>` : ''}
      <div class="ss-actions">
        <button class="maw-btn small ss-absorb" data-si="${i}" title="Absorb this stone — permanently learn the skill">✦ ABSORB</button>
        ${otherPlayers.length ? `
          <select class="ss-transfer-target" data-si="${i}">
            <option value="">Transfer to…</option>
            ${otherPlayers.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}
          </select>
          <button class="maw-btn ghost small ss-transfer" data-si="${i}" title="Send this stone to another player">↷ Send</button>
        ` : ''}
      </div>
    </div>
  `).join('');

  // Absorb handler
  host.querySelectorAll('.ss-absorb').forEach(btn => btn.addEventListener('click', ()=>{
    const i = Number(btn.dataset.si);
    const stone = c.skillStones[i]; if(!stone) return;
    if(!confirm(`Absorb "${stone.name}"? This will permanently add it to your skills and destroy the stone.`)) return;
    // Add to abilities
    c.abilities.push({
      name: stone.name,
      type: stone.type || 'Active',
      cost: stone.cost || '—',
      cooldown: stone.cooldown || '—',
      desc: (stone.desc || '') + (stone.element ? ` [${stone.element}]` : '') + ' [Skill Stone]'
    });
    // Remove stone
    c.skillStones.splice(i, 1);
    pushState(true); render();
    showToast(`✦ ${stone.name} absorbed! Skill permanently learned.`, 'buy');
  }));

  // Transfer handler
  host.querySelectorAll('.ss-transfer').forEach(btn => btn.addEventListener('click', ()=>{
    const i = Number(btn.dataset.si);
    const stone = c.skillStones[i]; if(!stone) return;
    const sel = host.querySelector(`.ss-transfer-target[data-si="${i}"]`);
    const targetId = sel?.value; if(!targetId){ showToast('Select a player to send to','warn'); return; }
    const target = state.characters.find(x => x.id === targetId);
    if(!target){ showToast('Target not found','warn'); return; }
    if(!confirm(`Send "${stone.name}" to ${target.name}? You will lose the stone.`)) return;
    // Move stone to target
    const transferred = { ...stone, fromPlayer: c.name || 'Unknown', fromDm: false };
    if(!Array.isArray(target.skillStones)) target.skillStones = [];
    target.skillStones.push(transferred);
    c.skillStones.splice(i, 1);
    pushState(true); render();
    showToast(`💎 ${stone.name} sent to ${target.name}!`, 'info');
  }));
}

function getElementColor(element){
  const map = {
    fire:'#d94f4f', ice:'#5aa8f5', cold:'#5aa8f5', lightning:'#e8a72c',
    water:'#3a8ac0', wind:'#5ad17a', earth:'#a08040', light:'#ffd460',
    dark:'#8a5ad1', radiant:'#ffd460', necrotic:'#8a5ad1', poison:'#5a9a78',
    force:'#a462d3', thunder:'#e0802a', arcane:'#a462d3', holy:'#ffd460'
  };
  return map[(element||'').toLowerCase()] || '#5ee7ff';
}

function renderDmCommendations(){
  const host = el('dmCommendList'); if(!host) return;
  const targetSel = el('dmCommendTarget');
  if(targetSel){
    const cur = targetSel.value;
    targetSel.innerHTML = state.characters.map((c,i)=>`<option value="${i}">${esc(c.name||`Player ${i+1}`)}</option>`).join('');
    if(cur) targetSel.value = cur;
  }
  host.innerHTML = COMMENDATIONS.map(m=>`
    <button class="dm-commend-card" data-id="${m.id}" title="${esc(m.desc)}">
      <span class="dm-commend-icon">${m.icon}</span>
      <span class="dm-commend-name">${esc(m.name)}</span>
      <span class="dm-commend-desc">${esc(m.desc)}</span>
    </button>`).join('');
  host.querySelectorAll('.dm-commend-card').forEach(b=> b.addEventListener('click', ()=> grantCommendation(b.dataset.id)));
}
function grantCommendation(id){
  if(!dmUnlocked) return;
  const idx = parseInt(el('dmCommendTarget')?.value);
  const c = state.characters[idx]; if(!c) return;
  if(!Array.isArray(c.commendations)) c.commendations=[];
  const m = COMMENDATION_BY_ID[id];
  if(c.commendations.includes(id)){
    c.commendations = c.commendations.filter(x=>x!==id);
    pushState(true); render();
    showToast(`Revoked: ${m.name} from ${c.name||'agent'}`,'warn');
  } else {
    c.commendations.push(id);
    pushState(true); render();
    SFX.confirm();
    showToast(`✦ ${c.name||'Agent'} awarded: ${m.name}`,'buy');
  }
}

// ================================================================
// WELCOME / CLAIM
// ================================================================
function checkWelcome(){
  if(spectator){ applySpectatorMode(); return; }
  if(dmUnlocked) return;
  el('welcomeOverlay')?.remove();
  const activeChars = state.characters.filter(c=>c.state==='active' && c.name);
  if(!activeChars.length) return;
  // if already claimed by me, skip
  if(getMyCharacter()) return;
  buildWelcome();
}
function recheckWelcomeIfNeeded(){
  if(spectator||dmUnlocked) return;
  if(getMyCharacter()) { el('welcomeOverlay')?.remove(); }
}
function openCharacterChooser(){
  if(dmUnlocked){ showToast('Character claiming is for player mode.','info'); return; }
  if(spectator){ spectator=false; sessionStorage.removeItem('dt-spectator'); document.body.classList.remove('spectator-mode'); el('spectatorBanner')?.remove(); }
  el('welcomeOverlay')?.remove();
  buildWelcome(true);
}

function buildWelcome(isSwitching=false){
  const ov = document.createElement('div');
  ov.id='welcomeOverlay'; ov.className='welcome-overlay';
  const mine = getMyCharacter();
  ov.innerHTML = `
    <div class="welcome-box character-picker-box">
      <div class="welcome-logo"><span class="welcome-diamond">◆</span></div>
      <div class="welcome-title">DUNGEON<span>TOWER</span></div>
      <div class="welcome-sub">${isSwitching?'CHOOSE YOUR CHARACTER':'PLAYER IDENTIFICATION REQUIRED'}</div>
      <p class="welcome-help">Select the character you are playing. Characters currently used by another live player are locked.</p>
      <div class="welcome-charlist" id="welcomeCharList"></div>
      <div class="welcome-actions">
        ${mine && isSwitching ? '<button class="maw-btn ghost" id="welcomeCancelBtn">Cancel</button>' : ''}
        <button class="maw-btn ghost" id="welcomeSkipBtn">I’m just watching</button>
        <button class="maw-btn dm" id="welcomeDmBtn">⚿ Administrator Access</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const list = el('welcomeCharList');
  state.characters.forEach((c,realIdx)=>{
    if(c.state!=='active') return;
    const taken = isTakenByLiveOther(c);
    const isOwn = c.claimedBy===MY_PRESENCE_ID;
    const rk = rankOf(c);
    const cls = getClassDef(c.playerClass);
    const btn = document.createElement('button');
    btn.type='button';
    btn.className = `welcome-char ${taken?'taken':''} ${isOwn?'current':''}`;
    btn.dataset.welcomeIdx = realIdx;
    btn.disabled = taken;
    btn.innerHTML = `
      ${c.portrait?`<img src="${c.portrait}" class="welcome-portrait">`:`<div class="welcome-portrait-empty">${(c.name||'?')[0].toUpperCase()}</div>`}
      <span class="welcome-char-name">${esc(c.name||`Player ${realIdx+1}`)}</span>
      <span class="welcome-char-rank" style="color:${rk.color}">${rk.tier}${cls?` · ${esc(cls.label)}`:''}</span>
      ${isOwn?'<span class="welcome-taken-label you-label">YOU</span>':taken?'<span class="welcome-taken-label">IN USE</span>':'<span class="welcome-available-label">AVAILABLE</span>'}`;
    btn.addEventListener('click', ()=>{
      if(btn.disabled) return;
      claimCharacter(realIdx);
      el('welcomeOverlay')?.remove();
      showToast(`Character selected: ${c.name||`Player ${realIdx+1}`}`,'buy');
    });
    list.appendChild(btn);
  });
  el('welcomeCancelBtn')?.addEventListener('click', ()=> el('welcomeOverlay')?.remove());
  el('welcomeSkipBtn')?.addEventListener('click', ()=>{
    releaseMyClaim(false);
    spectator=true; sessionStorage.setItem('dt-spectator','1');
    el('welcomeOverlay')?.remove(); applySpectatorMode(); render(); pushPresence();
  });
  el('welcomeDmBtn')?.addEventListener('click', ()=>{ el('welcomeOverlay')?.remove(); openDmLogin(); });
}
function refreshWelcomeTaken(){
  const list = el('welcomeCharList'); if(!list) return;
  state.characters.forEach((c,realIdx)=>{
    if(c.state!=='active') return;
    const btn = list.querySelector(`[data-welcome-idx="${realIdx}"]`); if(!btn) return;
    const taken = isTakenByLiveOther(c);
    const isOwn = c.claimedBy===MY_PRESENCE_ID;
    btn.disabled = taken;
    btn.classList.toggle('taken',taken);
    btn.classList.toggle('current',isOwn);
    btn.querySelector('.welcome-taken-label,.welcome-available-label')?.remove();
    const badge=document.createElement('span');
    if(isOwn){ badge.className='welcome-taken-label you-label'; badge.textContent='YOU'; }
    else if(taken){ badge.className='welcome-taken-label'; badge.textContent='IN USE'; }
    else { badge.className='welcome-available-label'; badge.textContent='AVAILABLE'; }
    btn.appendChild(badge);
  });
}
function releaseMyClaim(silent){
  let released = false;
  state.characters.forEach(c => {
    if (c.claimedBy === MY_PRESENCE_ID) {
      c.claimedBy = '';
      released = true;
    }
  });
  if (released && !silent) pushState(true);
  return released;
}

function claimCharacter(realIdx){
  const c = state.characters[realIdx]; if(!c || c.state!=='active') return false;
  if(isTakenByLiveOther(c)){ showToast(`${c.name||'That character'} is already in use.`, 'warn'); return false; }
  state.characters.forEach(ch=>{ if(ch.claimedBy===MY_PRESENCE_ID) ch.claimedBy=''; });
  c.claimedBy = MY_PRESENCE_ID;
  state.selectedCharacter = realIdx;
  localStorage.setItem('dt-my-idx', realIdx);
  spectator=false; sessionStorage.removeItem('dt-spectator'); document.body.classList.remove('spectator-mode'); el('spectatorBanner')?.remove();
  pushState(true); pushPresence(); render();
  renderIdentityBar();
  return true;
}

// Small persistent bar showing your claimed identity + a release/switch control.
function renderIdentityBar(){
  // Only for players (not DM, not spectator) who currently hold a character.
  const existing = el('identityBar');
  const mine = (!dmUnlocked && !spectator) ? getMyCharacter() : null;
  if(!mine){ existing?.remove(); return; }
  let bar = existing;
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'identityBar'; bar.className = 'identity-bar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = `<span class="idb-label">IDENTITY</span><span class="idb-name">${esc(mine.name||'Agent')}</span><button id="idbRelease" title="Free this character so you (or someone else) can pick another">⮌ Switch / Release</button>`;
  el('idbRelease')?.addEventListener('click', ()=>{
    if(!confirm(`Release ${mine.name||'this agent'}? You'll return to the identification screen and the character will be free for anyone.`)) return;
    releaseMyCharacter();
    el('identityBar')?.remove();
    _welcomeShown = false;
    checkWelcome();
    SFX?.click?.();
  });
}

// ================================================================
// SPECTATOR
// ================================================================
function applySpectatorMode(){
  if(!spectator) return;
  document.body.classList.add('spectator-mode');
  if(!el('spectatorBanner')){
    const b = document.createElement('div');
    b.id='spectatorBanner'; b.className='spectator-banner';
    b.innerHTML = `<span>👁 OBSERVER MODE — READ ONLY</span><button id="spectatorExit">Identify</button>`;
    document.body.appendChild(b);
    el('spectatorExit')?.addEventListener('click', ()=>{ spectator=false; sessionStorage.removeItem('dt-spectator'); document.body.classList.remove('spectator-mode'); b.remove(); checkWelcome(); });
  }
  disableAllInputs();
}
function disableAllInputs(){
  if(!spectator) return;
  document.querySelectorAll('input, textarea, select, button, [contenteditable]').forEach(elx=>{
    if(elx.closest('#characterTabs')||elx.closest('.character-tabs')||elx.classList.contains('sidebar-toggle')||elx.id==='sidebarToggle'||elx.closest('.spectator-banner')||elx.closest('.broadcast-screen')||elx.closest('.tab-bar')) return;
    if(elx.tagName==='INPUT'||elx.tagName==='TEXTAREA'||elx.tagName==='SELECT'){ elx.setAttribute('readonly','readonly'); elx.setAttribute('disabled','disabled'); }
    else elx.setAttribute('disabled','disabled');
    if(elx.hasAttribute('contenteditable')) elx.setAttribute('contenteditable','false');
    elx.classList.add('spectator-disabled');
  });
  document.querySelectorAll('.portrait-slot, label[for]').forEach(l=>{ if(l.closest('#characterTabs')) return; l.classList.add('spectator-disabled'); l.style.pointerEvents='none'; });
}

// ================================================================
// DM LOGIN
// ================================================================
function canOpenSystemArchive(){
  const c=getChar();
  return !!c && c.claimedBy===MY_PRESENCE_ID && c.state==='active' && !spectator;
}
function openSystemArchive(){
  if(!canOpenSystemArchive()){ showToast('The Archive rejects you. Claim and enter as your character first.','warn'); return; }
  const c=getChar();
  const ov=el('dmOverlay'), content=el('dmContent'); if(!ov||!content) return;
  ov.classList.remove('hidden');
  const found=new Set(c.discoveredSystemArchetypes||[]);
  content.innerHTML=`<div class="system-archive-page">
    <header class="sa-head"><div><small>HIDDEN PROTOCOL · ${esc(c.name||'PLAYER')}</small><h2>◈ SYSTEM ARCHETYPE ARCHIVE</h2><p>100 known System patterns. Mark only archetypes your character has actually encountered. Every discovery grants its listed skill resonance.</p></div><button class="sa-close" id="saClose">✕</button></header>
    <div class="sa-stats"><span><b id="saFoundCount">${found.size}</b>/100 DISCOVERED</span><span>SKILL RESONANCE <b>+1</b> EACH · MAX +3 / SKILL</span><span>SECRET ACCESS VERIFIED</span></div>
    <div class="sa-tools"><input id="saSearch" type="search" placeholder="Search 100 System archetypes..."><select id="saFilter"><option value="all">All Archetypes</option><option value="found">Discovered</option><option value="unknown">Not Met</option></select></div>
    <div class="sa-grid" id="saGrid"></div>
    <footer class="sa-foot">The Archive records recognition, not ownership. Discovering an archetype does not give you that full System; it grants only the listed resonance/easter-egg bonus.</footer>
  </div>`;
  const renderArchive=()=>{
    const q=(el('saSearch')?.value||'').trim().toLowerCase(), filter=el('saFilter')?.value||'all';
    const current=new Set(c.discoveredSystemArchetypes||[]);
    const list=SYSTEM_ARCHETYPES.filter(a=>(!q||(a.name+' '+a.desc+' '+a.skill).toLowerCase().includes(q)) && (filter==='all'||(filter==='found'?current.has(a.id):!current.has(a.id))));
    el('saGrid').innerHTML=list.map((a,idx)=>`<article class="sa-card ${current.has(a.id)?'found':''}" data-aid="${a.id}">
      <div class="sa-num">${String(SYSTEM_ARCHETYPES.indexOf(a)+1).padStart(3,'0')}</div><div class="sa-icon">${a.icon}</div>
      <div class="sa-copy"><h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p><div class="sa-bonus">RESONANCE · +1 ${esc(a.skill)}${a.special==='merchant5'?' · 5 × 5% SHOP DISCOUNTS':''}</div></div>
      <button class="sa-discover" data-discover="${a.id}">${current.has(a.id)?'✓ MET':'MARK AS MET'}</button>
    </article>`).join('') || '<div class="sa-empty">No archetypes match this filter.</div>';
    el('saFoundCount').textContent=current.size;
    el('saGrid').querySelectorAll('[data-discover]').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.discover, was=(c.discoveredSystemArchetypes||[]).includes(id), a=archetypeById(id);
      if(was){ c.discoveredSystemArchetypes=c.discoveredSystemArchetypes.filter(x=>x!==id); }
      else { c.discoveredSystemArchetypes=[...(c.discoveredSystemArchetypes||[]),id]; if(a?.special==='merchant5') c.archetypeDiscountUses=Math.max(c.archetypeDiscountUses||0,5); }
      pushState(true); renderArchive();
      showToast(was?`${a?.name||'System'} removed from discoveries`:`◈ ${a?.name||'System'} recognized · +1 ${a?.skill||'skill'}`,was?'info':'buy');
    }));
  };
  el('saSearch')?.addEventListener('input',renderArchive); el('saFilter')?.addEventListener('change',renderArchive); el('saClose')?.addEventListener('click',closeDmOverlay); renderArchive();
}
function handleDmSecretOrUnlock(){
  const value=el('dmPasswordInput')?.value||'';
  if(value===SYSTEM_ARCHIVE_CODE){ openSystemArchive(); return; }
  unlockDm();
}
function openDmLogin(){
  const ov = el('dmOverlay'); if(!ov) return;
  const content = el('dmContent'); if(!content) return;
  ov.classList.remove('hidden');

  if(dmUnlocked){
    buildDmPanelHtml();
    renderDmPanel();
    return;
  }

  content.innerHTML = `
    <div class="dm-login-card" id="dmLoginPanel">
      <div class="dm-card-title">⚔ GAME MASTER LOGIN</div>
      <div class="dm-card-body" style="text-align:center">
        <input type="password" id="dmPasswordInput" class="dm-pass-input" placeholder="Enter GM password" autocomplete="off">
        <button type="button" class="maw-btn" id="dmUnlockBtn" style="margin-top:.8rem;width:100%">UNLOCK</button>
      </div>
    </div>
  `;
  el('dmUnlockBtn')?.addEventListener('click', handleDmSecretOrUnlock);
  el('dmPasswordInput')?.addEventListener('keydown', e => { if(e.key==='Enter') handleDmSecretOrUnlock(); });
  el('dmPasswordInput')?.focus();
}

function buildDmPanelHtml(){
  const content = el('dmContent'); if(!content) return;
  const activeChars = state.characters.map((c,i)=>({c,i})).filter(x=>x.c.state==='active');
  const charOpts = activeChars.map(({c,i})=>`<option value="${i}">${esc(c.name||'P'+(i+1))}</option>`).join('');
  const charOptsAll = `<option value="all">All Active</option>` + charOpts;
  const dmCatalog = typeof getDefaultTowerShop==='function' ? getDefaultTowerShop() : (state.shop||[]);
  const dmShopOptions = dmCatalog.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')))
    .map(it=>`<option value="${esc(it.name||'')}">${esc(it.name||'')} · ${esc(it.category||'Misc')} · T${Number(it.tier)||1}</option>`).join('');

  content.innerHTML = `
    <div class="dm-full-panel" id="dmFullPanel">
      <div class="dm-head">
        <h2 class="dm-head-title">⚔ GAME MASTER</h2>
        <div class="dm-head-actions">
          <button class="maw-btn small" id="dmAddCharBtn">＋ Player</button>
          <button class="maw-btn ghost small" id="dmLockBtn">🔒</button>
          <button class="maw-btn ghost small" id="dmCloseBtn">✕</button>
        </div>
      </div>
      <section class="dm-command-overview">
        <div class="dm-ov-stat"><span>ACTIVE</span><strong>${state.characters.filter(c=>c.state==='active').length}</strong></div>
        <div class="dm-ov-stat"><span>RESERVE</span><strong>${state.characters.filter(c=>c.state==='reserve').length}</strong></div>
        <div class="dm-ov-stat"><span>SHOP STOCK</span><strong>${(state.shop||[]).length}</strong></div>
        <div class="dm-ov-stat"><span>PENDING</span><strong>${(state.requests||[]).filter(r=>r.status==='pending').length}</strong></div>
        <div class="dm-ov-stat wide"><span>CURRENT FLOOR / SCENE</span><strong>${esc(state.sceneName||'No active scene')}</strong></div>
      </section>
      <section class="dm-party-vitals" id="dmOpsParty"></section>
      <div class="dm-tabs">
        <button class="dm-tab active" data-dmtab="roster">◆ Roster</button>
        <button class="dm-tab" data-dmtab="rewards">✦ Rewards</button>
        <button class="dm-tab" data-dmtab="quests">📜 Quests</button>
        <button class="dm-tab" data-dmtab="skills">💎 Skills</button>
        <button class="dm-tab" data-dmtab="classes">🏷 Classes</button>
        <button class="dm-tab" data-dmtab="titles">♛ Titles</button>
        <button class="dm-tab" data-dmtab="systems">◈ Systems</button>
        <button class="dm-tab" data-dmtab="world">🌐 World</button>
      </div>
      <div class="dm-tab-content active" data-dmtab="roster">
        <div class="dm-card"><div class="dm-card-title">◆ Player Roster</div><div class="dm-card-body dm-roster-compact" id="dmRoster"></div></div>
        <div class="dm-card"><div class="dm-card-title">⚡ Quick Actions</div><div class="dm-card-body">
          <div class="dm-qa-row">
            <select id="dmActionTarget">${state.characters.map((c,i)=>`<option value="${i}">${esc(c.name||'Player '+(i+1))}</option>`).join('')}</select>
            <select id="dmActionType"><option value="hp-dmg">HP −</option><option value="hp-heal">HP +</option><option value="hp-full">HP Full</option><option value="mp-dmg">MP −</option><option value="mp-heal">MP +</option><option value="mp-full">MP Full</option><option value="full-rest">★ Full Rest</option></select>
            <input type="number" id="dmActionAmount" value="10" min="0">
            <button class="maw-btn small" id="dmActionBtn">GO</button>
          </div>
        </div></div>
      </div>
      <div class="dm-tab-content" data-dmtab="rewards">
        <div class="dm-card"><div class="dm-card-title">✦ EXP Awards</div><div class="dm-card-body">
          <div class="dm-qa-row"><select id="dmExpTarget">${charOptsAll}</select><input type="number" id="dmExpAmount" value="100" min="1"><button class="maw-btn small" id="dmExpBtn">+ Award</button><button class="maw-btn ghost small" id="dmExpTakeBtn">− Take</button></div>
          <div class="dm-preset-row">${[50,100,250,500,1000,5000].map(n=>`<button class="dm-preset dm-exp-preset" data-exp="${n}">${n>=1000?String(n/1000)+'k':n}</button>`).join('')}</div>
          <div id="dmExpStatus" class="dm-exp-status"></div>
        </div></div>
        <div class="dm-card"><div class="dm-card-title">💰 Gold Awards</div><div class="dm-card-body">
          <div class="dm-qa-row"><select id="dmGoldTarget">${charOptsAll}</select><input type="number" id="dmGoldAmount" value="100" min="0" placeholder="Gold amount"><button class="maw-btn small" id="dmGoldBtn">+ Award</button><button class="maw-btn ghost small" id="dmGoldTakeBtn">− Take</button></div>
          <div class="dm-preset-row">${[50,100,250,500,1000,5000].map(n=>`<button class="dm-preset dm-gold-preset" data-gold="${n}">${n>=1000?(n/1000)+'k':n}</button>`).join('')}</div>
        </div></div>
        <div class="dm-card dm-item-award-card"><div class="dm-card-title"><span>📦 Tower Item Awards</span><small>FROM SHOP CATALOG</small></div><div class="dm-card-body">
          <div class="dm-item-award-grid">
            <select id="dmItemAwardTarget">${charOptsAll}</select>
            <select id="dmItemAwardName"><option value="">— Select Shop Item —</option>${dmShopOptions}</select>
            <input id="dmItemAwardQty" type="number" min="1" value="1" title="Quantity">
            <button class="maw-btn small" id="dmItemAwardBtn">＋ GIVE ITEM</button>
          </div>
          <div class="dm-item-award-preview" id="dmItemAwardPreview">Select an item to see its shop description.</div>
        </div></div>
      </div>
      <div class="dm-tab-content dm-quest-workspace" data-dmtab="quests">
        <div class="dm-card dm-quest-builder"><div class="dm-card-title"><span>📜 Quest Builder</span><small>CREATE & ASSIGN</small></div><div class="dm-card-body">
          <input type="text" id="dmQuestName" placeholder="Quest name" style="margin-bottom:.3rem">
          <div class="dm-ss-form-row"><select id="dmQuestType"><option value="main">Main</option><option value="side">Side</option><option value="daily">Daily</option><option value="emergency">Emergency</option><option value="hunt">Hunt</option></select><select id="dmQuestRank">${RANKS.map(r=>`<option value="${r.id}">${r.id}</option>`).join('')}</select></div>
          <textarea id="dmQuestDesc" placeholder="Description" rows="2" style="margin-top:.3rem"></textarea>
          <div class="dm-mini-label" style="margin-top:.4rem">Objectives (one per line)</div>
          <textarea id="dmQuestObjectives" placeholder="Objectives — one per line&#10;Kill the boss&#10;Find the key" rows="3"></textarea><div class="dm-mini-label">Requirements / Failure Conditions</div><textarea id="dmQuestRequirements" placeholder="Level 10+&#10;No healing items&#10;Finish before midnight" rows="3"></textarea>
          <div class="dm-mini-label" style="margin-top:.4rem">Rewards</div>
          <div class="dm-ss-form-row"><input type="number" id="dmQuestExp" placeholder="EXP"><input type="number" id="dmQuestGold" placeholder="Gold"></div>
          <div class="dm-quest-item-picker">
            <select id="dmQuestShopItem"><option value="">— Add reward from Tower Exchange —</option>${dmShopOptions}</select>
            <input id="dmQuestShopQty" type="number" min="1" value="1" title="Quantity">
            <button class="maw-btn small" id="dmQuestAddShopItem" type="button">＋ ADD ITEM</button>
          </div>
          <div id="dmQuestRewardItems" class="dm-quest-reward-draft"><span class="dm-empty-inline">No item rewards selected.</span></div>
          <div class="dm-ss-form-row" style="margin-top:.4rem"><select id="dmQuestAssign"><option value="all">All Active Party</option>${activeChars.map(({c,i})=>`<option value="${c.id}">${esc(c.name||`Player ${i+1}`)}</option>`).join('')}</select><input type="text" id="dmQuestTimeLimit" placeholder="Time limit"><button class="maw-btn small" id="dmQuestCreateBtn">📜 Create</button></div>
        </div></div>
        <div class="dm-card dm-quest-board"><div class="dm-card-title"><span>📋 Quest Board</span><small>LIVE CAMPAIGN OBJECTIVES</small></div><div class="dm-card-body" id="dmQuestList"></div></div>
      </div>
      <div class="dm-tab-content" data-dmtab="skills">
        <div class="dm-card"><div class="dm-card-title">💎 Create Skill Stone</div><div class="dm-card-body"><div class="dm-ss-form">
          <input type="text" id="dmSSName" placeholder="Skill name">
          <div class="dm-ss-form-row"><select id="dmSSType"><option>Active</option><option>Passive</option><option>Ultimate</option></select><input type="text" id="dmSSCost" placeholder="MP cost"><input type="text" id="dmSSCooldown" placeholder="Cooldown"><input type="text" id="dmSSElement" placeholder="Element"></div>
          <textarea id="dmSSDesc" placeholder="Description" rows="2"></textarea>
          <div class="dm-ss-form-row"><select id="dmSSTarget">${charOpts}</select><button class="maw-btn small" id="dmSSAwardBtn">💎 Award</button></div>
        </div></div></div>
        <div class="dm-card"><div class="dm-card-title">📦 Inventories</div><div class="dm-card-body" id="dmSSInventories"></div></div>
      </div>
      <div class="dm-tab-content" data-dmtab="classes">
        <div class="dm-card"><div class="dm-card-title">🏷 Create Class</div><div class="dm-card-body">
          <div class="dm-ss-form-row"><input type="text" id="dmCCName" placeholder="Name"><input type="text" id="dmCCIcon" placeholder="Icon" value="✦" style="max-width:60px"><input type="color" id="dmCCColor" value="#5aa8f5" style="max-width:40px"></div>
          <div class="dm-ss-form-row" style="margin-top:.3rem"><select id="dmCCPrimary">${STATS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select><select id="dmCCHitDie"><option value="6">d6</option><option value="8" selected>d8</option><option value="10">d10</option><option value="12">d12</option></select><label style="font-size:.55rem;color:var(--text-dim);display:flex;align-items:center;gap:.2rem"><input type="checkbox" id="dmCCHidden">Hidden</label></div>
          <textarea id="dmCCDesc" placeholder="Description" rows="2" style="margin-top:.3rem"></textarea>
          <div class="dm-mini-label" style="margin-top:.4rem">Stat Bonuses</div>
          <div class="dm-cc-bonuses">${STATS.map(s=>`<label class="dm-cc-bonus-field"><span>${s}</span><input type="number" id="dmCCBonus${s}" value="0" min="0" max="10"></label>`).join('')}</div>
          <div class="dm-mini-label" style="margin-top:.4rem">Basic Skills</div>
          <div class="dm-ss-form-row"><input type="text" id="dmCCSkill1Name" placeholder="Skill 1"><input type="text" id="dmCCSkill1Cost" placeholder="Cost"></div>
          <textarea id="dmCCSkill1Desc" placeholder="Skill 1 desc" rows="1" style="margin-top:.2rem"></textarea>
          <div class="dm-ss-form-row" style="margin-top:.3rem"><input type="text" id="dmCCSkill2Name" placeholder="Skill 2"><input type="text" id="dmCCSkill2Cost" placeholder="Cost"></div>
          <textarea id="dmCCSkill2Desc" placeholder="Skill 2 desc" rows="1" style="margin-top:.2rem"></textarea>
          <button class="maw-btn small" id="dmCCCreateBtn" style="margin-top:.5rem">🏷 Create</button>
        </div></div>
        <div class="dm-card"><div class="dm-card-title">📋 Classes</div><div class="dm-card-body" id="dmCCList"></div></div>
      </div>
      <div class="dm-tab-content" data-dmtab="titles">
        <div class="dm-title-layout">
          <div class="dm-card">
            <div class="dm-card-title">♛ Create Title</div>
            <div class="dm-card-body">
              <div class="dm-title-form">
                <input type="text" id="dmTitleName" placeholder="Title name, e.g. Shadow Monarch">
                <div class="dm-ss-form-row">
                  <select id="dmTitleRarity">
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                  <input type="color" id="dmTitleColor" value="#77bfff">
                </div>
                <textarea id="dmTitleDesc" rows="2" placeholder="Lore / unlock condition / meaning"></textarea>
                <textarea id="dmTitlePassive" rows="2" placeholder="Passive effect or rule granted while equipped"></textarea>
                <button class="maw-btn small" id="dmTitleCreateBtn">♛ Create Title</button>
              </div>
            </div>
          </div>

          <div class="dm-card">
            <div class="dm-card-title">◆ Grant / Equip Title</div>
            <div class="dm-card-body">
              <div class="dm-title-assign">
                <select id="dmTitleTarget">${state.characters.map((c,i)=>`<option value="${i}">${esc(c.name||'Player '+(i+1))}</option>`).join('')}</select>
                <select id="dmTitleSelect">
                  <option value="">— Select Title —</option>
                  ${(state.titleCatalog||[]).map(t=>`<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('')}
                </select>
                <button class="maw-btn small" id="dmTitleGrantBtn">＋ Grant</button>
                <button class="maw-btn small" id="dmTitleEquipBtn">★ Equip</button>
                <button class="maw-btn ghost small" id="dmTitleRevokeBtn">− Revoke</button>
              </div>
              <div id="dmTitleOwnership" class="dm-title-ownership"></div>
            </div>
          </div>
        </div>

        <div class="dm-card">
          <div class="dm-card-title">📚 Title Catalog</div>
          <div class="dm-card-body" id="dmTitleCatalog"></div>
        </div>
      </div>
      <div class="dm-tab-content" data-dmtab="systems">
        ${dmSystemManagerHtml(charOpts)}
      </div>
      <div class="dm-tab-content" data-dmtab="world">
        <div class="dm-card"><div class="dm-card-title">🏪 Shop</div><div class="dm-card-body">
          <div class="dm-qa-row" style="margin-bottom:.5rem"><button class="maw-btn small" id="dmLoadDefaultShop">⚡ Stock System Catalog</button><button class="maw-btn ghost small" id="dmClearShop">Clear</button><span style="font-size:.55rem;color:var(--text-dim);margin-left:auto">${(state.shop||[]).length} items</span></div>
          <input type="text" id="dmShopItemName" placeholder="Custom item" style="margin-bottom:.3rem">
          <div class="dm-qa-row"><input type="number" id="dmShopItemPrice" placeholder="Price"><select id="dmShopItemTier"><option value="1">T1</option><option value="2">T2</option><option value="3">T3</option><option value="4">T4</option></select><select id="dmShopItemCat">${SHOP_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select><button class="maw-btn small" id="dmShopAddBtn">＋</button></div>
          <textarea id="dmShopItemDesc" placeholder="Description" rows="1" style="margin-top:.3rem"></textarea>
        </div></div>
        <div class="dm-card"><div class="dm-card-title">📡 Broadcast</div><div class="dm-card-body">
          <input type="text" id="dmSceneName" placeholder="Scene / Floor" value="${esc(state.sceneName||'')}" style="margin-bottom:.4rem">
          <textarea id="dmBroadcast" rows="2" placeholder="System announcement…">${esc(state.broadcast||'')}</textarea>
          <button class="maw-btn small" id="dmBroadcastBtn" style="margin-top:.4rem">Send</button>
        </div></div>
      </div>
    </div>
  `;

  // Wire DM tab switching
  
  el('dmSystemTarget')?.addEventListener('change', renderDmSystemEditor);
  el('dmSystemAttach')?.addEventListener('click',()=>{
    const c=state.characters[Number(el('dmSystemTarget')?.value)]; if(!c)return;
    const ps=ensurePersonalSystem(c);
    ps.type=el('dmSystemType')?.value||'none';
    ps.name=el('dmSystemName')?.value.trim()||'';
    ps.description=el('dmSystemDesc')?.value.trim()||'';
    pushState(true); renderDmSystemEditor(); renderCharacterTabs();
  });
  renderDmSystemEditor();

content.querySelectorAll('.dm-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      content.querySelectorAll('.dm-tab').forEach(b=>b.classList.remove('active'));
      content.querySelectorAll('.dm-tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      content.querySelector(`.dm-tab-content[data-dmtab="${btn.dataset.dmtab}"]`)?.classList.add('active');
    });
  });

  // Focus guard — prevent re-render while DM is typing
  const dmPanel = el('dmFullPanel');
  if(dmPanel){
    dmPanel.addEventListener('focusin', ()=>{ _dmFocused = true; });
    dmPanel.addEventListener('focusout', ()=>{ setTimeout(()=>{ _dmFocused = false; }, 150); });
  }

  // Wire DM head buttons
  el('dmCloseBtn')?.addEventListener('click', closeDmOverlay);
  el('dmLockBtn')?.addEventListener('click', lockDm);
  el('dmAddCharBtn')?.addEventListener('click', ()=>{
    state.characters.push(blankChar(state.characters.length));
    pushState(true); render(); buildDmPanelHtml(); renderDmPanel();
  });

  // Quick actions
  el('dmActionBtn')?.addEventListener('click', ()=>{
    const idx = Number(el('dmActionTarget')?.value)||0;
    const c = state.characters[idx]; if(!c) return;
    const type = el('dmActionType')?.value;
    const amt = Math.max(0, Number(el('dmActionAmount')?.value)||0);
    switch(type){
      case 'hp-dmg':  c.hp.current = clamp((c.hp.current||0)-amt,0,c.hp.max); break;
      case 'hp-heal': c.hp.current = clamp((c.hp.current||0)+amt,0,c.hp.max); break;
      case 'hp-full': c.hp.current = c.hp.max; break;
      case 'mp-dmg':  c.mana.current = clamp((c.mana.current||0)-amt,0,c.mana.max); break;
      case 'mp-heal': c.mana.current = clamp((c.mana.current||0)+amt,0,c.mana.max); break;
      case 'mp-full': c.mana.current = c.mana.max; break;
      case 'full-rest':
        c.hp.current=c.hp.max; c.mana.current=c.mana.max; c.fatigue=0;
        c.tempHp=Math.max(0, systemMilestoneTier(c.systemStats?.con)*10);
        c.deathSaves={successes:0,failures:0,stable:false}; break;
    }
    ensureClamp(c); pushState(true); render(); renderDmPanel();
    showToast(`${type.replace('-',' ')} applied to ${c.name||'Player'}`, 'info');
  });

  // Shop management
  el('dmLoadDefaultShop')?.addEventListener('click', ()=>{
    const catalog = getDefaultTowerShop();
    if(!catalog.length){ showToast('Shop catalog unavailable','warn'); return; }
    if(state.shop.length && !confirm(`Add ${catalog.length} items to shop? (Current: ${state.shop.length} items)`)) return;
    // Merge — add items not already in shop (by name)
    const existing = new Set((state.shop||[]).map(it=>it.name));
    let added = 0;
    catalog.forEach(it => {
      if(!existing.has(it.name)){
        state.shop.push({...it});
        added++;
      }
    });
    pushState(true);
    // Don't call full render() — just update shop display
    if(state.activeTab === 'shop') renderShop();
    showToast(`Added ${added} new items (${existing.size} already existed). Shop: ${state.shop.length} total.`, 'buy');
  });
  el('dmClearShop')?.addEventListener('click', ()=>{
    if(!confirm('Clear all shop items?')) return;
    state.shop = []; pushState(true);
    if(state.activeTab === 'shop') renderShop();
    showToast('Shop cleared', 'info');
  });
  el('dmShopAddBtn')?.addEventListener('click', ()=>{
    const name = el('dmShopItemName')?.value?.trim(); if(!name) return;
    state.shop.push({
      tier: Number(el('dmShopItemTier')?.value)||1,
      name, category: el('dmShopItemCat')?.value||'Consumables',
      price: Math.max(0, Number(el('dmShopItemPrice')?.value)||0),
      desc: el('dmShopItemDesc')?.value||'', stock:null
    });
    pushState(true); render();
    if(el('dmShopItemName')) el('dmShopItemName').value='';
    if(el('dmShopItemDesc')) el('dmShopItemDesc').value='';
    showToast(`Added "${name}" to shop`, 'buy');
  });

  // Tower item awards — direct GM grant from the exact Shop catalog.
  function updateDmItemAwardPreview(){
    const item=findTowerShopItem(el('dmItemAwardName')?.value);
    const host=el('dmItemAwardPreview'); if(!host) return;
    host.innerHTML=item
      ? `<b>${esc(item.icon||'◆')} ${esc(item.name)}</b><span>${esc(item.desc||'No description.')}</span>${item.stats?`<small>${esc(item.stats)}</small>`:''}`
      : 'Select an item to see its shop description.';
  }
  el('dmItemAwardName')?.addEventListener('change',updateDmItemAwardPreview);
  el('dmItemAwardBtn')?.addEventListener('click',()=>{
    const item=findTowerShopItem(el('dmItemAwardName')?.value);
    if(!item){ showToast('Select a Shop item','warn'); return; }
    const qty=Math.max(1,Number(el('dmItemAwardQty')?.value)||1);
    const target=el('dmItemAwardTarget')?.value;
    const targets=target==='all'?state.characters.filter(c=>c.state==='active'):[state.characters[Number(target)]].filter(Boolean);
    targets.forEach(c=>giveTowerShopItem(c,item,qty,'gm'));
    pushState(true); render();
    showToast(`📦 ${qty}× ${item.name} awarded to ${target==='all'?'the party':targets[0]?.name||'Player'}`,'buy');
  });

  // Gold awards
  el('dmGoldBtn')?.addEventListener('click', ()=>{
    const target = el('dmGoldTarget')?.value;
    const amount = Math.max(0, Number(el('dmGoldAmount')?.value) || 0);
    if(!amount){ showToast('Enter a gold amount','warn'); return; }
    if(target === 'all'){
      state.characters.filter(c=>c.state==='active').forEach(c=>{ c.points = (c.points||0)+amount; });
      showToast(`+${fmtGold(amount)} gold to all players`, 'info');
    } else {
      const c = state.characters[Number(target)]; if(!c) return;
      c.points = (c.points||0)+amount;
      showToast(`+${fmtGold(amount)} gold to ${c.name||'Player'}`, 'info');
    }
    pushState(true); render(); renderDmPanel();
  });
  el('dmGoldTakeBtn')?.addEventListener('click', ()=>{
    const target = el('dmGoldTarget')?.value;
    const amount = Math.max(0, Number(el('dmGoldAmount')?.value) || 0);
    if(!amount){ showToast('Enter a gold amount','warn'); return; }
    if(target === 'all'){
      state.characters.filter(c=>c.state==='active').forEach(c=>{ c.points = Math.max(0,(c.points||0)-amount); });
      showToast(`\u2212${fmtGold(amount)} gold from all players`, 'warn');
    } else {
      const c = state.characters[Number(target)]; if(!c) return;
      c.points = Math.max(0,(c.points||0)-amount);
      showToast(`\u2212${fmtGold(amount)} gold from ${c.name||'Player'}`, 'warn');
    }
    pushState(true); render(); renderDmPanel();
  });
  content.querySelectorAll('.dm-gold-preset').forEach(btn=>btn.addEventListener('click',()=>{
    const e = el('dmGoldAmount'); if(e) e.value = btn.dataset.gold;
  }));

  // EXP awards
  function awardExpFromDm(take=false){
    const target = el('dmExpTarget')?.value;
    const raw = Number(el('dmExpAmount')?.value) || 0;
    if(!raw){ showToast('Enter an EXP amount','warn'); return; }
    const amount = take ? -Math.abs(raw) : Math.abs(raw);
    const targets = target === 'all'
      ? state.characters.filter(c=>c.state==='active')
      : [state.characters[Number(target)]].filter(Boolean);
    targets.forEach(c => {
      if(amount > 0){
        const oldLvl = c.systemLevel || 1;
        const levelsGained = gainExp(c, amount);
        if(levelsGained > 0){
          showToast(`✦ ${c.name||'Player'} leveled up! System Lv.${oldLvl} → ${c.systemLevel}${c.level !== dndLevelFromSystem(oldLvl) ? ` (DnD Lv.${c.level}!)` : ''}`, 'buy');
        }
      } else {
        // Take EXP — reduce but don't go below 0
        c.exp = Math.max(0, (c.exp||0) + amount);
      }
    });
    const verb = amount > 0 ? `+${fmtGold(amount)}` : `${fmtGold(amount)}`;
    showToast(`${verb} EXP to ${target==='all'?'all players':targets[0]?.name||'Player'}`, amount>0?'info':'warn');
    pushState(true); render(); renderDmExpStatus();
  }
  el('dmExpBtn')?.addEventListener('click', ()=>awardExpFromDm(false));
  el('dmExpTakeBtn')?.addEventListener('click', ()=>awardExpFromDm(true));
  // Presets fill the amount input then award
  document.querySelectorAll('.dm-exp-preset').forEach(btn => btn.addEventListener('click', ()=>{
    const inp = el('dmExpAmount'); if(inp) inp.value = btn.dataset.exp;
    awardExpFromDm();
  }));
  renderDmExpStatus();

  // Scene + broadcast
  el('dmSceneName')?.addEventListener('input', e=>{ state.sceneName = e.target.value; pushState(); });
  el('dmBroadcastBtn')?.addEventListener('click', ()=>{
    state.broadcast = el('dmBroadcast')?.value||'';
    pushState(true); render();
    showToast('Broadcast sent', 'info');
  });

  // Skill Stone award
  el('dmSSAwardBtn')?.addEventListener('click', ()=>{
    const name = el('dmSSName')?.value?.trim(); if(!name){ showToast('Give the skill a name','warn'); return; }
    const targetIdx = Number(el('dmSSTarget')?.value);
    const c = state.characters[targetIdx]; if(!c){ showToast('Invalid target','warn'); return; }
    const stone = {
      id: 'ss-' + Date.now() + '-' + Math.random().toString(16).slice(2,6),
      name,
      type: el('dmSSType')?.value || 'Active',
      cost: el('dmSSCost')?.value || '—',
      cooldown: el('dmSSCooldown')?.value || '—',
      desc: el('dmSSDesc')?.value || '',
      element: el('dmSSElement')?.value || '',
      fromDm: true,
      fromPlayer: ''
    };
    if(!Array.isArray(c.skillStones)) c.skillStones = [];
    c.skillStones.push(stone);
    pushState(true);
    showToast(`💎 Skill Stone "${name}" awarded to ${c.name||'Player'}!`, 'buy');
    // Clear form
    ['dmSSName','dmSSCost','dmSSCooldown','dmSSElement','dmSSDesc'].forEach(id=>{ const e=el(id); if(e) e.value=''; });
    renderDmSkillStoneInventories();
  });

  renderDmSkillStoneInventories();

  // Custom Class creation
  el('dmCCCreateBtn')?.addEventListener('click', ()=>{
    const name = el('dmCCName')?.value?.trim();
    if(!name){ showToast('Give the class a name','warn'); return; }
    const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,20) + '_' + Date.now().toString(36);
    const bonuses = {};
    STATS.forEach(s => {
      const v = Number(el('dmCCBonus'+s)?.value) || 0;
      if(v > 0) bonuses[s] = v;
    });
    const skills = [];
    const sk1Name = el('dmCCSkill1Name')?.value?.trim();
    if(sk1Name) skills.push({ name:sk1Name, type:'Active', cost:el('dmCCSkill1Cost')?.value||'—', cooldown:'—', desc:el('dmCCSkill1Desc')?.value||'' });
    const sk2Name = el('dmCCSkill2Name')?.value?.trim();
    if(sk2Name) skills.push({ name:sk2Name, type:'Active', cost:el('dmCCSkill2Cost')?.value||'—', cooldown:'—', desc:el('dmCCSkill2Desc')?.value||'' });

    const newClass = {
      id, label: name,
      icon: el('dmCCIcon')?.value || '✦',
      color: el('dmCCColor')?.value || '#5aa8f5',
      primary: el('dmCCPrimary')?.value || 'STR',
      desc: el('dmCCDesc')?.value || '',
      bonuses,
      hitDie: Number(el('dmCCHitDie')?.value) || 8,
      hidden: el('dmCCHidden')?.checked || false,
      custom: true,
      // Store starter skills inside the class definition so Firebase reloads
      // can rebuild CLASS_BASIC_SKILLS instead of losing custom class skills.
      skills: skills.map(sk=>({...sk}))
    };
    if(!Array.isArray(state.customClasses)) state.customClasses = [];
    state.customClasses.push(newClass);
    if(skills.length) CLASS_BASIC_SKILLS[id] = skills.map(sk=>({...sk}));
    pushState(true);
    showToast(`🏷 Custom class "${name}" created!`, 'buy');
    ['dmCCName','dmCCDesc','dmCCSkill1Name','dmCCSkill1Cost','dmCCSkill1Desc','dmCCSkill2Name','dmCCSkill2Cost','dmCCSkill2Desc'].forEach(fid=>{ const e=el(fid); if(e) e.value=''; });
    STATS.forEach(s=>{ const e=el('dmCCBonus'+s); if(e) e.value='0'; });
    renderDmCustomClasses();
    buildDmPanelHtml(); renderDmPanel();
  });
  renderDmCustomClasses();

  // Quest reward item draft — select directly from the Tower Exchange catalog.
  function renderDmQuestRewardDraft(){
    const host=el('dmQuestRewardItems'); if(!host) return;
    if(!_dmQuestRewardItems.length){ host.innerHTML='<span class="dm-empty-inline">No item rewards selected.</span>'; return; }
    host.innerHTML=_dmQuestRewardItems.map((r,i)=>{
      const item=findTowerShopItem(r.name);
      return `<div class="dm-quest-reward-chip">
        <span>${esc(item?.icon||'📦')}</span><b>${esc(r.name)}</b><small>×${r.qty}</small>
        ${item?.desc?`<em>${esc(item.desc)}</em>`:''}
        <button type="button" data-qri="${i}" title="Remove">✕</button>
      </div>`;
    }).join('');
    host.querySelectorAll('[data-qri]').forEach(b=>b.addEventListener('click',()=>{
      _dmQuestRewardItems.splice(Number(b.dataset.qri),1); renderDmQuestRewardDraft();
    }));
  }
  el('dmQuestAddShopItem')?.addEventListener('click',()=>{
    const item=findTowerShopItem(el('dmQuestShopItem')?.value);
    if(!item){ showToast('Select a Shop item reward','warn'); return; }
    const qty=Math.max(1,Number(el('dmQuestShopQty')?.value)||1);
    const ex=_dmQuestRewardItems.find(x=>x.name===item.name);
    if(ex) ex.qty+=qty; else _dmQuestRewardItems.push({name:item.name,qty});
    renderDmQuestRewardDraft();
  });
  renderDmQuestRewardDraft();

  // Quest creation
  el('dmQuestCreateBtn')?.addEventListener('click', ()=>{
    const name = el('dmQuestName')?.value?.trim();
    if(!name){ showToast('Give the quest a name','warn'); return; }
    const objText = (el('dmQuestObjectives')?.value||'').split('\n').filter(l=>l.trim());
    const itemsText = _dmQuestRewardItems.map(x=>({name:x.name,qty:Math.max(1,Number(x.qty)||1)}));
    const quest = {
      id: 'quest-' + Date.now() + '-' + Math.random().toString(16).slice(2,6),
      name,
      type: el('dmQuestType')?.value || 'side',
      rank: el('dmQuestRank')?.value || 'E',
      status: 'available',
      desc: el('dmQuestDesc')?.value || '',
      requirements: (el('dmQuestRequirements')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean),
      objectives: objText.map(text => ({
        id: 'obj-' + Math.random().toString(16).slice(2,6),
        text, done: false
      })),
      rewards: {
        exp: Math.max(0, Number(el('dmQuestExp')?.value) || 0),
        gold: Math.max(0, Number(el('dmQuestGold')?.value) || 0),
        items: itemsText.map(x=>({...x}))
      },
      assignedTo: el('dmQuestAssign')?.value === 'all' ? 'all' : [el('dmQuestAssign')?.value],
      timeLimit: el('dmQuestTimeLimit')?.value || '',
      dmNotes: '',
      completedBy: [],
      created: Date.now()
    };
    if(!Array.isArray(state.cases)) state.cases = [];
    state.cases.push(quest);
    pushState(true);
    showToast(`📜 Quest "${name}" created!`, 'buy');
    ['dmQuestName','dmQuestDesc','dmQuestObjectives','dmQuestExp','dmQuestGold','dmQuestTimeLimit'].forEach(id=>{
      const e = el(id); if(e) e.value = '';
    });
    _dmQuestRewardItems=[];
    renderDmQuestRewardDraft();
    renderDmQuestList();
  });
  renderDmQuestList();
}


function renderDmTitleOwnership(){
  const host=el('dmTitleOwnership'); if(!host) return;
  const idx=Number(el('dmTitleTarget')?.value)||0;
  const c=state.characters[idx]; if(!c){ host.innerHTML='<div class="dm-empty">No character selected.</div>'; return; }
  ensureCharacterTitles(c);
  if(!c.titles.length){
    host.innerHTML='<div class="dm-empty">No titles unlocked for this character.</div>';
    return;
  }
  host.innerHTML=`<div class="dm-title-owned-list">${c.titles.map(name=>{
    const def=titleDefByName(name);
    const equipped=c.title===name;
    return `<button class="dm-title-owned ${equipped?'equipped':''}" data-equip-title="${esc(name)}" style="--title-c:${def?.color||'#77bfff'}">
      <span>${equipped?'★':'◇'}</span>
      <strong>${esc(name)}</strong>
      <small>${equipped?'EQUIPPED':(def?.rarity||'legacy').toUpperCase()}</small>
    </button>`;
  }).join('')}</div>`;
  host.querySelectorAll('[data-equip-title]').forEach(btn=>btn.addEventListener('click',()=>{
    c.title=btn.dataset.equipTitle;
    pushState(true); render(); renderDmTitleOwnership();
  }));
}
function renderDmTitleCatalog(){
  const host=el('dmTitleCatalog'); if(!host) return;
  const titles=state.titleCatalog||[];
  if(!titles.length){
    host.innerHTML='<div class="dm-empty">No GM titles created yet. Existing legacy character titles remain preserved.</div>';
    return;
  }
  host.innerHTML=`<div class="dm-title-catalog-grid">${titles.map((t,i)=>`
    <article class="dm-title-card" style="--title-c:${esc(t.color||'#77bfff')}">
      <div class="dm-title-card-top">
        <span class="dm-title-crown">♛</span>
        <div><strong>${esc(t.name)}</strong><small>${esc((t.rarity||'common').toUpperCase())}</small></div>
        <button class="dm-title-delete" data-ti="${i}" title="Delete title definition">✕</button>
      </div>
      ${t.desc?`<p>${esc(t.desc)}</p>`:''}
      ${t.passive?`<div class="dm-title-passive"><b>PASSIVE</b>${esc(t.passive)}</div>`:''}
    </article>`).join('')}</div>`;
  host.querySelectorAll('.dm-title-delete').forEach(btn=>btn.addEventListener('click',()=>{
    const i=Number(btn.dataset.ti), t=state.titleCatalog[i]; if(!t) return;
    if(!confirm(`Delete title definition "${t.name}"? Characters who already own it will keep the title name as a legacy title.`)) return;
    state.titleCatalog.splice(i,1);
    pushState(true); renderDmTitleCatalog();
    const sel=el('dmTitleSelect');
    if(sel) sel.innerHTML='<option value="">— Select Title —</option>'+(state.titleCatalog||[]).map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
  }));
}

function renderDmCustomClasses(){
  const host = el('dmCCList'); if(!host) return;
  const customs = state.customClasses || [];
  if(!customs.length){ host.innerHTML='<div class="dm-empty">No custom classes. Built-in classes are always available.</div>'; return; }
  host.innerHTML = customs.map((cc,i) => {
    const bonusStr = Object.entries(cc.bonuses||{}).filter(([,v])=>v>0).map(([k,v])=>`+${v} ${k}`).join(', ') || 'None';
    return `
    <div class="dm-cc-row" style="border-left-color:${cc.color}">
      <div class="dm-cc-top">
        <span style="font-size:1rem">${cc.icon}</span>
        <strong style="color:${cc.color}">${esc(cc.label)}</strong>
        <span class="dm-cc-meta">d${cc.hitDie} · ${cc.primary} · ${cc.hidden?'Hidden':'Visible'}</span>
        <button class="dm-quest-del" data-cci="${i}" title="Delete class">✕</button>
      </div>
      <div class="dm-cc-info">${esc(cc.desc||'No description')}</div>
      <div class="dm-cc-bonuses-display">Bonuses: ${bonusStr}</div>
    </div>`;
  }).join('');
  host.querySelectorAll('[data-cci]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!confirm('Delete this custom class?')) return;
    state.customClasses.splice(+btn.dataset.cci, 1);
    pushState(true); renderDmCustomClasses();
    showToast('Custom class deleted','info');
  }));
}

function renderDmExpStatus(){
  const host = el('dmExpStatus'); if(!host) return;
  const chars = state.characters.filter(c => c.state === 'active');
  host.innerHTML = chars.map(c => {
    const sysLvl = c.systemLevel || 1;
    const expCur = expIntoCurrentLevel(c);
    const expNeed = expNeededForNextLevel(c);
    const pct = expNeed > 0 ? Math.min(100, (expCur / expNeed) * 100) : 0;
    return `
      <div class="dm-exp-row">
        <span class="dm-exp-name">${esc(c.name||'Unnamed')}</span>
        <span class="dm-exp-lvl">Sys.${sysLvl} <span style="color:var(--text-dim)">(DnD ${c.level||1})</span></span>
        <div class="dm-exp-bar"><div class="dm-exp-bar-fill" style="width:${pct}%"></div></div>
        <span class="dm-exp-nums">${fmtGold(expCur)} / ${fmtGold(expNeed)}</span>
      </div>`;
  }).join('') || '<div class="dm-empty">No active players.</div>';
}

function renderDmSkillStoneInventories(){
  const host = el('dmSSInventories'); if(!host) return;
  const chars = state.characters.filter(c => c.state === 'active');
  if(!chars.length){ host.innerHTML = '<div class="dm-empty">No active players.</div>'; return; }
  host.innerHTML = chars.map(c => {
    const stones = c.skillStones || [];
    return `
      <div class="dm-ss-player">
        <div class="dm-ss-player-name">${esc(c.name||'Unnamed')} <span class="dm-ss-count">${stones.length} stone${stones.length===1?'':'s'}</span></div>
        ${stones.length ? stones.map(s => `
          <div class="dm-ss-stone">
            <span class="dm-ss-stone-name">💎 ${esc(s.name)}</span>
            <span class="dm-ss-stone-type">${esc(s.type)}</span>
            ${s.element ? `<span class="dm-ss-stone-elem">${esc(s.element)}</span>` : ''}
            <button class="dm-ss-revoke" data-cid="${esc(c.id)}" data-sid="${esc(s.id)}" title="Revoke this stone">✕</button>
          </div>
        `).join('') : '<div class="dm-empty" style="padding:.3rem 0">No stones held.</div>'}
      </div>`;
  }).join('');
  host.querySelectorAll('.dm-ss-revoke').forEach(btn => btn.addEventListener('click', ()=>{
    const c = state.characters.find(x => x.id === btn.dataset.cid); if(!c) return;
    c.skillStones = (c.skillStones||[]).filter(s => s.id !== btn.dataset.sid);
    pushState(true); renderDmSkillStoneInventories();
    showToast('Skill stone revoked','info');
  }));
}

function unlockDm(){
  if(el('dmPasswordInput')?.value !== DM_PASS){ showToast('Access denied','warn'); return; }
  dmUnlocked = true; sessionStorage.setItem('dt-dm','1');
  buildDmPanelHtml();
  renderDmPanel();
  render();
}
function lockDm(){ dmUnlocked=false; sessionStorage.removeItem('dt-dm'); el('dmOverlay')?.classList.add('hidden'); render(); }
function closeDmOverlay(){ el('dmOverlay')?.classList.add('hidden'); }

function applyCharacterAccents(){
  state.characters.forEach((c,i)=>{
    const color=c.accentColor||''; const tabs=document.querySelectorAll('.character-tab');
    if(tabs[i]&&color) tabs[i].style.setProperty('--char-color',color);
  });
  const c=getChar();
  if(c.accentColor) document.documentElement.style.setProperty('--accent', c.accentColor);
}

// ================================================================
// FIELD BINDINGS
// ================================================================
function canEdit(){
  if(spectator) return false;
  if(dmUnlocked) return true;
  const c = getChar();
  return !!c && (c.claimedBy===MY_PRESENCE_ID || !c.claimedBy);
}
function updateField(field, value){
  const c = getChar();
  const map = { currentHp:'hp.current', maxHp:'hp.max', currentMana:'mana.current', maxMana:'mana.max' };
  if(map[field]){ const[o,k]=map[field].split('.'); c[o][k]=Math.max(0,Number(value)||0); }
  else if(['level','armor','tempHp','points'].includes(field)) c[field]=Math.max(0,Number(value)||0);
  else c[field]=value;
  ensureClamp(c); pushState();
  renderHeader();
  if(map[field]||['level','armor','tempHp','points'].includes(field)){ renderCalcPanel(); }
  if(field==='level'){ renderSkillsMatrix(); renderCalcPanel(); }
  renderCharacterTabs();
}

function bindFields(){
  const ii = (id,field)=>{ const e=el(id); if(e) e.addEventListener('input', ev=>updateField(field,ev.target.value)); };
  // GLOBAL SAFETY NET: whenever any field loses focus, push pending edits to the server
  // immediately so nothing is lost when leaving the page mid-edit.
  document.addEventListener('focusout', e=>{
    if(e.target && (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'||e.target.isContentEditable)){
      flushPendingPush();
    }
  });
  ii('charName','name'); ii('charCodename','title');
  ii('charAge','age');
  ii('charBackground','background');
  ii('charSpeed','speed'); ii('charArmor','armor'); ii('charTempHp','tempHp');
  ii('currentHp','currentHp'); ii('maxHp','maxHp');
  ii('currentMana','currentMana'); ii('maxMana','maxMana');
  ii('notesArea','notesText');

  // Rank dropdown
  el('charClearance')?.addEventListener('change', e=>{ getChar().rank=e.target.value; pushState(true); render(); });

  // state radios
  ['Active','Reserve','Dead'].forEach(st=>{
    el('state'+st)?.addEventListener('change', ()=>{ getChar().state=st.toLowerCase(); pushState(true); render(); });
  });

  // portrait upload
  el('portraitInput')?.addEventListener('change', e=>{
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const max=400; const scale=Math.min(max/img.width,max/img.height,1);
        const cv=document.createElement('canvas'); cv.width=img.width*scale; cv.height=img.height*scale;
        cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
        getChar().portrait=cv.toDataURL('image/jpeg',0.8);
        pushState(true); renderMainFields();
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // accent color
  el('accentColorInput')?.addEventListener('input', e=>{ getChar().accentColor=e.target.value; pushState(); applyCharacterAccents(); renderCharacterTabs(); });

  // resource adjust buttons (event delegation)
  document.addEventListener('click', e=>{
    const btn=e.target.closest('.adj-btn'); if(!btn) return;
    adjustResource(btn.dataset.resource, Number(btn.dataset.amt));
  });

  // add buttons
  el('addWeaponBtn')?.addEventListener('click', addWeapon);
  el('addInvBtn')?.addEventListener('click', addInventoryItem);
  el('invAddName')?.addEventListener('keydown', e=>{ if(e.key==='Enter') addInventoryItem(); });
  el('addRelBtn')?.addEventListener('click', addRelationship);
  el('addAbilityBtn')?.addEventListener('click', addAbility);

  // tab nav
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b=> b.addEventListener('click', ()=>{ state.activeTab=b.dataset.tab; SFX.tab(); renderTabs(); }));

  // Auto-set HP/MP buttons
  el('autoSetHp')?.addEventListener('click', ()=>{
    const c = getChar();
    const suggested = calcSuggestedMaxHp(c);
    c.hp.max = suggested; c.hp.current = suggested;
    pushState(true); renderMainFields(); renderHeader(); renderStatusWindow();
    showToast(`Max HP set to ${suggested}`, 'info');
  });
  el('autoSetMp')?.addEventListener('click', ()=>{
    const c = getChar();
    const suggested = calcSuggestedMaxMana(c);
    c.mana.max = suggested; c.mana.current = suggested;
    pushState(true); renderMainFields(); renderHeader(); renderStatusWindow();
    showToast(`Max MP set to ${suggested}`, 'info');
  });

  // Keyboard shortcuts: Alt+1-9 for tabs
  document.addEventListener('keydown', e=>{
    if(!e.altKey || e.ctrlKey || e.metaKey) return;
    const ae = document.activeElement;
    if(ae && (ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.tagName==='SELECT')) return;
    const tabs = ['profile','status','skills','loadout','abilities','cases','relations','shop','notes'];
    const idx = Number(e.key) - 1;
    if(idx >= 0 && idx < tabs.length){ e.preventDefault(); state.activeTab = tabs[idx]; renderTabs(); }
  });
  // DM nav (sub-tabs inside DM panel)
  document.querySelectorAll('.dm-nav-btn[data-dm]').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('.dm-nav-btn').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.dm-section').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); SFX.tab();
    document.querySelector(`.dm-section[data-dm="${b.dataset.dm}"]`)?.classList.add('active');
  }));

  // DM controls
  el('dmTriggerBtn')?.addEventListener('click', openDmLogin);
  el('dmUnlockBtn')?.addEventListener('click', handleDmSecretOrUnlock);
  el('dmPasswordInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter') handleDmSecretOrUnlock(); });
  el('dmCloseBtn')?.addEventListener('click', closeDmOverlay);
  el('dmCloseBtn2')?.addEventListener('click', closeDmOverlay);
  el('dmLockBtn')?.addEventListener('click', lockDm);
  el('addShopItemBtn')?.addEventListener('click', addShopItem);
  el('dmAddAgentBtn')?.addEventListener('click', dmAddAgent);
  el('dmBroadcastSendBtn')?.addEventListener('click', ()=>{
    const msg = el('dmBroadcastInput')?.value.trim();
    if(!msg){ showToast('Enter a broadcast message','warn'); return; }
    sendBroadcast(msg);
    if(el('dmBroadcastInput')) el('dmBroadcastInput').value='';
    showToast('Broadcast transmitted to all terminals','info');
  });
  el('dmBroadcastClearBtn')?.addEventListener('click', ()=>{ clearBroadcast(); removeBroadcastScreen(); });
  // live typing SFX on the broadcast composer (terminal feel)
  el('dmBroadcastInput')?.addEventListener('keydown', e=>{ if(e.key.length===1||e.key==='Backspace') SFX.key(); });

  // New feature bindings
  el('sfxToggle')?.addEventListener('click', toggleSfx);
  el('knockBtn')?.addEventListener('click', sendKnock);
  document.querySelectorAll('.site-alert-btn[data-alert]').forEach(b=> b.addEventListener('click', ()=> setSiteAlert(b.dataset.alert)));
  el('dmCommendTarget')?.addEventListener('change', ()=>{});
  document.querySelectorAll('.bulk-btn[data-bulk]').forEach(b=> b.addEventListener('click', ()=> bulkApply(b.dataset.bulk)));
  el('reqSubmitBtn')?.addEventListener('click', submitRequest);
  el('reqItemName')?.addEventListener('keydown', e=>{ if(e.key==='Enter') submitRequest(); });
  el('dmClearRequestsBtn')?.addEventListener('click', clearResolvedRequests);

  // sidebar toggle (mobile)
  el('sidebarToggle')?.addEventListener('click', ()=> document.querySelector('.sidebar')?.classList.toggle('open'));

  // character chooser + reserve toggle
  el('chooseCharacterBtn')?.addEventListener('click', openCharacterChooser);
  el('showReserveToggle')?.addEventListener('click', ()=>{ state.showReserve=!state.showReserve; renderCharacterTabs(); el('showReserveToggle').textContent = state.showReserve?'Hide Reserve':'Show Reserve'; });
}


// ================================================================
// QUICK-PLAY ENHANCEMENTS
// Small, non-invasive helpers layered on top of the existing system.
// ================================================================
function askPositiveAmount(label, fallback=5){
  const raw = window.prompt(label, String(fallback));
  if(raw === null) return null;
  const amount = Math.floor(Number(raw));
  if(!Number.isFinite(amount) || amount <= 0){
    showToast('Enter a positive whole number','warn');
    return null;
  }
  return amount;
}

function quickAdjustHp(direction){
  if(!canEdit()){ showToast('This character is read-only','warn'); return; }
  const c = getChar(); if(!c) return;
  const amount = askPositiveAmount(direction < 0 ? 'Damage amount:' : 'Healing amount:', 5);
  if(amount === null) return;
  c.hp.current = Math.max(0, Math.min(Number(c.hp.max)||0, (Number(c.hp.current)||0) + direction * amount));
  ensureClamp(c);
  pushState(true);
  render();
  if(direction < 0){
    try{ SFX.hit?.(); }catch(e){}
    showToast(`-${amount} HP`, 'warn');
  }else{
    try{ SFX.confirm?.(); }catch(e){}
    showToast(`+${amount} HP`, 'buy');
  }
}

function quickFullRest(){
  if(!canEdit()){ showToast('This character is read-only','warn'); return; }
  const c = getChar(); if(!c) return;
  c.hp.current = Math.max(0, Number(c.hp.max)||0);
  c.mana.current = Math.max(0, Number(c.mana.max)||0);
  c.tempHp = 0;
  c.fatigue = 0;
  c.deathSaves = {successes:0, failures:0, stable:false};
  ensureClamp(c);
  pushState(true);
  render();
  try{ SFX.confirm?.(); }catch(e){}
  showToast('Full rest complete — HP and Mana restored','buy');
}

function quickRollD20(){
  const roll = 1 + Math.floor(Math.random()*20);
  const type = roll===20 ? 'buy' : roll===1 ? 'warn' : 'info';
  try{ roll===20 ? SFX.confirm?.() : SFX.click?.(); }catch(e){}
  showToast(`◇ D20 RESULT: ${roll}${roll===20?' — CRITICAL!':roll===1?' — CRITICAL FAIL':''}`, type);
}

function bindEnhancements(){
  el('quickDamageBtn')?.addEventListener('click', ()=>quickAdjustHp(-1));
  el('quickHealBtn')?.addEventListener('click', ()=>quickAdjustHp(1));
  el('quickRestBtn')?.addEventListener('click', quickFullRest);
  el('quickRollBtn')?.addEventListener('click', quickRollD20);

  document.addEventListener('keydown', e=>{
    if(!e.altKey || e.ctrlKey || e.metaKey) return;
    const n = Number(e.key);
    if(!Number.isInteger(n) || n < 1 || n > 9) return;
    const tabs = [...document.querySelectorAll('.tab-btn[data-tab]')];
    const target = tabs[n-1];
    if(target){
      e.preventDefault();
      target.click();
    }
  });

  // Close the mobile sidebar after choosing a character or tab.
  document.addEventListener('click', e=>{
    if(!window.matchMedia('(max-width:760px)').matches) return;
    if(e.target.closest('.character-tab') || e.target.closest('.tab-btn')){
      document.querySelector('.sidebar')?.classList.remove('open');
    }
  });
}

// ================================================================
// MIGRATION + INIT
// ================================================================
async function migrateIfNeeded(){
  try {
    const mainSnap = await getDoc(doc(db,'campaigns',DOC));
    if(mainSnap.exists()){
      // Doc exists. Start listening.
      startListener();
      return;
    }
    // No doc yet — create a blank one. Don't auto-load shop (DM does it manually).
    const pushData = { ...state };
    delete pushData.activeTab;
    delete pushData.selectedCharacter;
    await setDoc(doc(db,'campaigns',DOC), { data: JSON.stringify(pushData) });
    startListener();
  } catch(e){ console.error('init', e); startListener(); }
}

bindFields();
render();
if(spectator) applySpectatorMode();
migrateIfNeeded();
startPresenceListener();
startBroadcastListener();
pushPresence();

// New systems init
// reflect saved SFX preference on the toggle
(function(){ const b=el('sfxToggle'); if(b && !_sfxEnabled){ b.classList.add('off'); b.textContent='♪ SFX OFF'; } })();
// idle corruption: any interaction resets the timer
['mousemove','keydown','click','touchstart','scroll'].forEach(ev=> document.addEventListener(ev, resetIdle, {passive:true}));
resetIdle();
document.addEventListener('click', ()=>{ _ac(); if(_sfxEnabled) startAmbient(); }, { once:true });
startKnockListener();

// ═══════════════════════════════════════════════════════════════════
// TOOLTIP SYSTEM — global, delegated, system-UI styling
// Any element with data-tt="text" gets a floating tooltip on hover.
// ═══════════════════════════════════════════════════════════════════
(function initTooltips(){
  const tt = document.createElement('div');
  tt.className = 'dt-tooltip';
  tt.setAttribute('aria-hidden','true');
  document.body.appendChild(tt);

  let showTimer = null;
  let currentTarget = null;

  function position(target){
    const r = target.getBoundingClientRect();
    // Prefer above the target, centered
    const ttR = tt.getBoundingClientRect();
    let left = r.left + r.width/2 - ttR.width/2;
    let top  = r.top - ttR.height - 10;
    let side = 'top';
    // Flip below if there isn't room above
    if (top < 8) {
      top = r.bottom + 10;
      side = 'bottom';
    }
    // Clamp horizontally
    const pad = 10;
    if (left < pad) left = pad;
    if (left + ttR.width > window.innerWidth - pad) left = window.innerWidth - pad - ttR.width;
    tt.style.left = left + 'px';
    tt.style.top  = top + 'px';
    tt.dataset.side = side;
  }

  document.addEventListener('mouseover', e => {
    const target = e.target.closest?.('[data-tt]');
    if (!target || target === currentTarget) return;
    const text = target.dataset.tt;
    if (!text) return;
    currentTarget = target;
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      tt.textContent = text;
      tt.classList.add('show');
      // Position AFTER text is set so the size is correct
      requestAnimationFrame(() => position(target));
    }, 320);
  });

  document.addEventListener('mouseout', e => {
    const target = e.target.closest?.('[data-tt]');
    if (!target || target !== currentTarget) return;
    // Only hide if we're leaving the tooltip-owner element entirely
    if (e.relatedTarget && target.contains(e.relatedTarget)) return;
    clearTimeout(showTimer);
    currentTarget = null;
    tt.classList.remove('show');
  });

  // Hide on scroll or click (prevents stale tooltips)
  document.addEventListener('scroll', () => { tt.classList.remove('show'); currentTarget = null; }, {capture:true, passive:true});
  document.addEventListener('mousedown', () => { tt.classList.remove('show'); currentTarget = null; });
})();



console.info('[DUNGEON TOWER] BUILD 16.3 loaded — Chaos Gacha unlimited vault + single active ability');

console.log('[DUNGEON TOWER] BUILD 16.1 loaded — GM panel lifecycle fix');

console.log('[DUNGEON TOWER] BUILD 16.2 loaded — GM command center redesign');

console.info('[DUNGEON TOWER] BUILD 16.3 CHAOS GACHA PATCH active');

console.info('[DUNGEON TOWER] BUILD 16.4 loaded — Chaos Gacha save-race fix');


/* BUILD 16.5 — GM scroll safety.
   Some older CSS builds lock body overflow while the GM overlay is open.
   Make the visible GM container itself vertically scrollable. */
function _dtEnsureDmScroll(){
  const candidates=[
    document.getElementById('dmOverlay'),
    document.querySelector('.dm-overlay'),
    document.querySelector('.dm-modal'),
    document.querySelector('.dm-page-overlay')
  ].filter(Boolean);
  candidates.forEach(node=>{
    node.style.overflowY='auto';
    node.style.overflowX='hidden';
    node.style.maxHeight='100vh';
  });
}
document.addEventListener('click',e=>{
  if(e.target.closest?.('#dmBtn,.dm-btn,[data-open-dm],[data-dm-tab]')){
    requestAnimationFrame(_dtEnsureDmScroll);
  }
});
window.addEventListener('resize',_dtEnsureDmScroll);
setTimeout(_dtEnsureDmScroll,0);
console.info('[DUNGEON TOWER] BUILD 16.5 loaded — GM System Editor scrolling fixed');


/* BUILD 16.6 — target the REAL GM scroll surface. */
function _dtFixRealDmScroller(){
  const overlay=document.getElementById('dmOverlay');
  if(!overlay) return;
  const panel=overlay.querySelector('.dm-full-panel');
  const tab=overlay.querySelector('.dm-tab-content') || overlay.querySelector('#dmTabContent');
  if(panel){
    panel.style.overflow='hidden';
    panel.style.display='flex';
    panel.style.flexDirection='column';
  }
  if(tab){
    tab.style.setProperty('overflow-y','auto','important');
    tab.style.setProperty('overflow-x','hidden','important');
    tab.style.setProperty('min-height','0','important');
    tab.style.setProperty('height','0','important');
    tab.style.setProperty('flex','1 1 auto','important');
  }
}
const _dtDmScrollObserver=new MutationObserver(()=>requestAnimationFrame(_dtFixRealDmScroller));
const _dtDmOverlay=document.getElementById('dmOverlay');
if(_dtDmOverlay) _dtDmScrollObserver.observe(_dtDmOverlay,{childList:true,subtree:true});
document.addEventListener('click',()=>requestAnimationFrame(_dtFixRealDmScroller));
setTimeout(_dtFixRealDmScroller,0);
console.info('[DUNGEON TOWER] BUILD 16.6 loaded — actual GM tab scroller repaired');

console.info('[DUNGEON TOWER] BUILD 17 loaded — Overhaul + expanded Exchange');

console.info('[DUNGEON TOWER] BUILD 17.1 loaded — quest shop rewards + system inventory');

console.info('[DUNGEON TOWER] BUILD 18 loaded — hidden 100-system archetype archive');

// ============================================================================
// BUILD 19 — CAMPAIGN MANAGEMENT EXPANSION
// Quest acceptance, Personal Quest System, Bestiary + Loot Tables,
// item inspection, equipment slots, skill trees, NPC manager and party stash.
// Additive layer: existing systems remain intact and are only wrapped where needed.
// ============================================================================

const DT19_EQUIPMENT_SLOTS = [
  {id:'mainHand',label:'Main Hand',icon:'⚔'},
  {id:'offHand',label:'Off Hand',icon:'🗡'},
  {id:'armor',label:'Armor',icon:'🛡'},
  {id:'head',label:'Head',icon:'◈'},
  {id:'necklace',label:'Necklace',icon:'◇'},
  {id:'ring1',label:'Ring I',icon:'○'},
  {id:'ring2',label:'Ring II',icon:'○'},
  {id:'accessory',label:'Accessory',icon:'✦'}
];
const DT19_RANK_ORDER = {E:0,D:1,C:2,B:3,A:4,S:5};
const DT19_NPC_STATUSES = ['Alive','Dead','Missing','Unknown'];
const DT19_NPC_ATTITUDES = ['Hostile','Unfriendly','Neutral','Friendly','Allied'];

function dt19Id(prefix='id'){
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
}
function dt19Clone(x){
  try{return JSON.parse(JSON.stringify(x));}catch(e){return x;}
}
function dt19EnsureInventoryIds(list){
  if(!Array.isArray(list)) return [];
  list.forEach((it,i)=>{
    if(!it || typeof it!=='object') return;
    if(!it.id) it.id=dt19Id(`item${i}`);
  });
  return list;
}
function dt19EnsureCharacter(c){
  if(!c || typeof c!=='object') return c;
  c.inventory=dt19EnsureInventoryIds(c.inventory||[]);
  if(!c.equipment || typeof c.equipment!=='object') c.equipment={};
  DT19_EQUIPMENT_SLOTS.forEach(s=>{ if(!(s.id in c.equipment)) c.equipment[s.id]=''; });
  const liveItemIds=new Set((c.inventory||[]).map(it=>String(it.id||'')));
  Object.keys(c.equipment).forEach(k=>{if(c.equipment[k]&&!liveItemIds.has(String(c.equipment[k])))c.equipment[k]='';});
  if(!Array.isArray(c.skillTreeNodes)) c.skillTreeNodes=[];
  c.skillTreeNodes=c.skillTreeNodes.map((n,i)=>({
    id:String(n?.id||dt19Id(`skillnode${i}`)),
    name:String(n?.name||'Unnamed Node'),
    desc:String(n?.desc||''),
    tier:Math.max(1,Number(n?.tier)||1),
    prerequisiteId:String(n?.prerequisiteId||''),
    status:['locked','available','learned'].includes(n?.status)?n.status:'locked'
  }));
  const ps=ensurePersonalSystem(c);
  if(!ps.quest || typeof ps.quest!=='object') ps.quest={smallQuests:[],requirementNotes:'',complexityLevel:1};
  if(!Array.isArray(ps.quest.systemQuests)) ps.quest.systemQuests=[];
  ps.quest.systemQuests=ps.quest.systemQuests.map((q,i)=>dt19NormalizeSystemQuest(q,i));
  return c;
}
function dt19NormalizeSystemQuest(q={},i=0){
  return {
    id:String(q.id||dt19Id(`sysquest${i}`)),
    name:String(q.name||'Untitled System Quest'),
    desc:String(q.desc||''),
    rank:RANK_BY_ID[q.rank]?q.rank:'E',
    status:['offered','active','completed','failed'].includes(q.status)?q.status:'offered',
    accepted:!!q.accepted,
    objectives:Array.isArray(q.objectives)?q.objectives.map(o=>({id:String(o?.id||dt19Id('sqobj')),text:String(o?.text||''),done:!!o?.done})):[],
    hiddenObjectives:Array.isArray(q.hiddenObjectives)?q.hiddenObjectives.map(o=>({id:String(o?.id||dt19Id('sqhidden')),text:String(o?.text||''),done:!!o?.done,revealed:!!o?.revealed})):[],
    requirements:Array.isArray(q.requirements)?q.requirements.map(String):[],
    failureConditions:Array.isArray(q.failureConditions)?q.failureConditions.map(String):[],
    rewards:{
      exp:Math.max(0,Number(q.rewards?.exp)||0),
      gold:Math.max(0,Number(q.rewards?.gold)||0),
      items:Array.isArray(q.rewards?.items)?q.rewards.items.map(x=>typeof x==='object'?{...x}:{name:String(x),qty:1}).filter(x=>x.name):[]
    },
    timeLimit:String(q.timeLimit||''),
    rewardGranted:!!q.rewardGranted,
    created:Number(q.created)||Date.now()
  };
}
function dt19NormalizeQuestExtras(q={},raw={}){
  const src=raw||{};
  q.hiddenObjectives=Array.isArray(src.hiddenObjectives)?src.hiddenObjectives.map(o=>({
    id:String(o?.id||dt19Id('hidden')),
    text:String(o?.text||''),done:!!o?.done,revealed:!!o?.revealed
  })):(Array.isArray(q.hiddenObjectives)?q.hiddenObjectives:[]);
  q.failureConditions=Array.isArray(src.failureConditions)?src.failureConditions.map(String):(Array.isArray(q.failureConditions)?q.failureConditions:[]);
  q.optionalObjectives=Array.isArray(src.optionalObjectives)?src.optionalObjectives.map(o=>({id:String(o?.id||dt19Id('optional')),text:String(o?.text||''),done:!!o?.done})):(Array.isArray(q.optionalObjectives)?q.optionalObjectives:[]);
  q.acceptedBy=Array.isArray(src.acceptedBy)?[...new Set(src.acceptedBy.map(String))]:(Array.isArray(q.acceptedBy)?q.acceptedBy:[]);
  q.declinedBy=Array.isArray(src.declinedBy)?[...new Set(src.declinedBy.map(String))]:(Array.isArray(q.declinedBy)?q.declinedBy:[]);
  q.requireAcceptance=src.requireAcceptance===undefined ? (q.requireAcceptance===undefined?true:!!q.requireAcceptance) : !!src.requireAcceptance;
  q.minimumRank=RANK_BY_ID[src.minimumRank]?src.minimumRank:(RANK_BY_ID[q.minimumRank]?q.minimumRank:'E');
  q.prerequisiteQuestId=String(src.prerequisiteQuestId||q.prerequisiteQuestId||'');
  q.chainNextId=String(src.chainNextId||q.chainNextId||'');
  q.rewardsGranted=!!(src.rewardsGranted??q.rewardsGranted);
  return q;
}
function dt19EnsureState(){
  if(!Array.isArray(state.characters)) state.characters=[];
  state.characters.forEach(dt19EnsureCharacter);
  if(!Array.isArray(state.bestiary)) state.bestiary=[];
  state.bestiary=state.bestiary.map((b,i)=>({
    id:String(b?.id||dt19Id(`monster${i}`)),
    name:String(b?.name||'Unnamed Monster'),
    rank:RANK_BY_ID[b?.rank]?b.rank:'E',
    type:String(b?.type||'Beast'),
    hp:Math.max(0,Number(b?.hp)||0),
    ac:Math.max(0,Number(b?.ac)||10),
    desc:String(b?.desc||''),
    abilities:Array.isArray(b?.abilities)?b.abilities.map(String):[],
    lootTable:Array.isArray(b?.lootTable)?b.lootTable.map(x=>({
      name:String(x?.name||''),chance:clamp(Number(x?.chance)||0,0,100),qty:Math.max(1,Number(x?.qty)||1)
    })).filter(x=>x.name):[]
  }));
  if(!Array.isArray(state.npcs)) state.npcs=[];
  state.npcs=state.npcs.map((n,i)=>({
    id:String(n?.id||dt19Id(`npc${i}`)),name:String(n?.name||'Unnamed NPC'),faction:String(n?.faction||''),
    location:String(n?.location||''),status:DT19_NPC_STATUSES.includes(n?.status)?n.status:'Alive',
    attitude:DT19_NPC_ATTITUDES.includes(n?.attitude)?n.attitude:'Neutral',notes:String(n?.notes||''),
    visibleToPlayers:n?.visibleToPlayers!==false
  }));
  if(!Array.isArray(state.partyStash)) state.partyStash=[];
  state.partyStash=dt19EnsureInventoryIds(state.partyStash).map(it=>({...it,qty:Math.max(1,Number(it.qty)||1)}));
  if(!Array.isArray(state.cases)) state.cases=[];
  state.cases.forEach(q=>dt19NormalizeQuestExtras(q,q));
}

const _dt19BlankChar=blankChar;
blankChar=function(i){
  const c=_dt19BlankChar(i);
  dt19EnsureCharacter(c);
  return c;
};

const _dt19Normalize=normalize;
normalize=function(raw){
  const m=_dt19Normalize(raw);
  const rawCases=Array.isArray(raw?.cases)?raw.cases:[];
  (m.cases||[]).forEach((q,i)=>{
    const rq=rawCases.find(x=>String(x?.id||'')===String(q.id)) || rawCases[i] || {};
    dt19NormalizeQuestExtras(q,rq);
  });
  state=m;
  dt19EnsureState();
  return m;
};

dt19EnsureState();

// ------------------------------ ITEM INSPECTION ------------------------------
function dt19EnsureItemModal(){
  let modal=el('dt19ItemModal');
  if(modal) return modal;
  modal=document.createElement('div');
  modal.id='dt19ItemModal';
  modal.className='dt19-modal hidden';
  modal.innerHTML=`<div class="dt19-modal-backdrop" data-dt19-close></div><section class="dt19-item-dialog" role="dialog" aria-modal="true">
    <button class="dt19-modal-x" data-dt19-close type="button">✕</button><div id="dt19ItemModalBody"></div></section>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{ if(e.target.closest('[data-dt19-close]')) modal.classList.add('hidden'); });
  return modal;
}
function dt19CompatibleSlots(it){
  const cat=String(it?.category||'').toLowerCase();
  const name=String(it?.name||'').toLowerCase();
  if(cat==='weapon') return ['mainHand','offHand'];
  if(cat==='armor'){
    if(/helm|helmet|hood|circlet|crown/.test(name)) return ['head'];
    return ['armor'];
  }
  if(cat==='accessory'){
    if(/ring/.test(name)) return ['ring1','ring2'];
    if(/necklace|amulet|pendant|periapt/.test(name)) return ['necklace'];
    if(/helm|helmet|circlet|crown/.test(name)) return ['head'];
    return ['accessory','ring1','ring2','necklace'];
  }
  return [];
}
function dt19ShowItem(it,context={}){
  if(!it) return;
  const modal=dt19EnsureItemModal(), body=el('dt19ItemModalBody');
  const rarity=String(it.rarity||'common').toLowerCase();
  const slots=dt19CompatibleSlots(it);
  const equipControls=context.character && context.inventoryIndex!=null && slots.length ? `
    <div class="dt19-inspect-actions"><select id="dt19EquipSlot">${slots.map(id=>{const s=DT19_EQUIPMENT_SLOTS.find(x=>x.id===id);return `<option value="${id}">${s?.icon||'◆'} ${s?.label||id}</option>`;}).join('')}</select>
    <button class="maw-btn small" id="dt19EquipNow">EQUIP</button></div>`:'';
  body.innerHTML=`<div class="dt19-item-hero rarity-${esc(rarity)}">
    <div class="dt19-item-icon">${esc(it.icon||'◆')}</div><div><span class="dt19-kicker">${esc((it.shopCategory||it.category||'Item').toUpperCase())}</span>
    <h2>${esc(it.name||'Unnamed Item')}</h2><div class="dt19-item-tags"><span>${esc(rarity.toUpperCase())}</span>${it.tier?`<span>TIER ${Number(it.tier)||1}</span>`:''}</div></div></div>
    ${it.stats?`<div class="dt19-item-statline">${esc(it.stats)}</div>`:''}
    <p class="dt19-item-description">${esc(it.description||it.notes||'No description recorded.')}</p>
    <div class="dt19-item-meta"><span>VALUE <b>◆ ${fmtGold(Number(it.value)||Math.floor((Number(it.price)||0)*.5))}</b></span>${it.qty?`<span>QUANTITY <b>${Number(it.qty)||1}</b></span>`:''}</div>${equipControls}`;
  modal.classList.remove('hidden');
  el('dt19EquipNow')?.addEventListener('click',()=>{
    const c=context.character, inv=c?.inventory?.[context.inventoryIndex]; if(!c||!inv) return;
    c.equipment[el('dt19EquipSlot').value]=inv.id;
    pushState(true); modal.classList.add('hidden'); renderInventory(); showToast(`${inv.name} equipped`,'buy');
  });
}

const _dt19RenderInventoryCard=renderInventoryCard;
renderInventoryCard=function(it,i,systemItem=false){
  let html=_dt19RenderInventoryCard(it,i,systemItem);
  const inject=`<button class="inv-inspect dt19-icon-btn" data-inspect-inv="${i}" type="button" title="Inspect item">⌕</button>`;
  html=html.replace(`<button class="inv-del" data-i="${i}">✕</button>`,`${inject}<button class="inv-del" data-i="${i}">✕</button>`);
  return html;
};

// ------------------------------ EQUIPMENT + STASH ----------------------------
function dt19EquippedItem(c,slot){
  const id=String(c?.equipment?.[slot]||'');
  return (c?.inventory||[]).find(it=>String(it.id)===id)||null;
}
function dt19RenderEquipment(){
  const tab=document.querySelector('.tab-content[data-tab="loadout"]'); if(!tab) return;
  let host=el('dt19EquipmentPanel');
  if(!host){
    host=document.createElement('section'); host.id='dt19EquipmentPanel'; host.className='dt19-loadout-section';
    const firstTitle=tab.querySelector('.panel-title');
    if(firstTitle) tab.insertBefore(host,firstTitle); else tab.prepend(host);
  }
  const c=getChar(); if(!c) return; dt19EnsureCharacter(c);
  host.innerHTML=`<div class="panel-title dt19-section-title">Equipped Gear <span>${DT19_EQUIPMENT_SLOTS.filter(s=>dt19EquippedItem(c,s.id)).length}/${DT19_EQUIPMENT_SLOTS.length} slots</span></div>
    <div class="dt19-equipment-grid">${DT19_EQUIPMENT_SLOTS.map(s=>{const it=dt19EquippedItem(c,s.id);return `<article class="dt19-equip-slot ${it?'filled':''}">
      <div class="dt19-equip-slot-head"><span>${s.icon}</span><b>${s.label}</b></div>
      ${it?`<button class="dt19-equipped-item" data-equipped-slot="${s.id}" type="button"><strong>${esc(it.name)}</strong><small>${esc((it.rarity||'common').toUpperCase())}</small></button><button class="dt19-unequip" data-unequip="${s.id}" type="button">UNEQUIP</button>`:'<div class="dt19-empty-slot">EMPTY</div>'}
    </article>`;}).join('')}</div>`;
  host.querySelectorAll('[data-unequip]').forEach(b=>b.addEventListener('click',()=>{c.equipment[b.dataset.unequip]='';pushState(true);dt19RenderEquipment();}));
  host.querySelectorAll('[data-equipped-slot]').forEach(b=>b.addEventListener('click',()=>{const it=dt19EquippedItem(c,b.dataset.equippedSlot);if(it)dt19ShowItem(it,{character:c,inventoryIndex:c.inventory.indexOf(it)});}));
}
function dt19AddToStash(item,qty=1){
  dt19EnsureState();
  const clone={...dt19Clone(item),id:dt19Id('stash'),qty:Math.max(1,Number(qty)||1),source:'party-stash'};
  const key=String(clone.name||'').toLowerCase();
  const existing=state.partyStash.find(x=>String(x.name||'').toLowerCase()===key && String(x.rarity||'')===String(clone.rarity||''));
  if(existing) existing.qty=(Number(existing.qty)||1)+clone.qty; else state.partyStash.push(clone);
}
function dt19RenderPartyStash(){
  const tab=document.querySelector('.tab-content[data-tab="loadout"]'); if(!tab) return;
  let host=el('dt19PartyStash');
  if(!host){ host=document.createElement('section'); host.id='dt19PartyStash'; host.className='dt19-loadout-section'; tab.appendChild(host); }
  const c=getChar(); if(!c) return;
  host.innerHTML=`<div class="panel-title dt19-section-title">Party Storage <span>Shared stash · ${state.partyStash.length} stacks</span></div>
    <div class="dt19-stash-grid">${state.partyStash.length?state.partyStash.map((it,i)=>`<article class="dt19-stash-item"><button class="dt19-stash-main" data-stash-inspect="${i}" type="button"><span>${esc(it.icon||'◆')}</span><div><strong>${esc(it.name)}</strong><small>${esc(it.category||'Misc')} · x${Number(it.qty)||1}</small></div></button><button class="maw-btn ghost small" data-stash-take="${i}" type="button">TAKE 1</button></article>`).join(''):'<div class="empty-note">Party storage is empty.</div>'}</div>
    <div class="dt19-stash-deposit"><select id="dt19DepositItem"><option value="">— Deposit an inventory item —</option>${(c.inventory||[]).map((it,i)=>`<option value="${i}">${esc(it.name)} ×${Number(it.qty)||1}</option>`).join('')}</select><button class="maw-btn small" id="dt19DepositBtn" type="button">DEPOSIT 1</button></div>`;
  host.querySelectorAll('[data-stash-inspect]').forEach(b=>b.addEventListener('click',()=>dt19ShowItem(state.partyStash[+b.dataset.stashInspect])));
  host.querySelectorAll('[data-stash-take]').forEach(b=>b.addEventListener('click',()=>{
    const idx=+b.dataset.stashTake, it=state.partyStash[idx]; if(!it)return;
    const copy={...dt19Clone(it),id:dt19Id('item'),qty:1,source:'party-stash'};
    const existing=c.inventory.find(x=>String(x.name||'').toLowerCase()===String(copy.name||'').toLowerCase()&&String(x.rarity||'')===String(copy.rarity||''));
    if(existing) existing.qty=(Number(existing.qty)||1)+1; else c.inventory.push(copy);
    it.qty=(Number(it.qty)||1)-1; if(it.qty<=0) state.partyStash.splice(idx,1);
    pushState(true); renderInventory(); showToast(`${copy.name} taken from Party Storage`,'buy');
  }));
  el('dt19DepositBtn')?.addEventListener('click',()=>{
    const idx=Number(el('dt19DepositItem')?.value); const it=c.inventory?.[idx]; if(!it)return;
    dt19AddToStash(it,1); it.qty=(Number(it.qty)||1)-1;
    const equippedIds=new Set(Object.values(c.equipment||{}).map(String));
    if(it.qty<=0){ if(equippedIds.has(String(it.id))) Object.keys(c.equipment).forEach(k=>{if(String(c.equipment[k])===String(it.id))c.equipment[k]='';}); c.inventory.splice(idx,1); }
    pushState(true); renderInventory(); showToast(`${it.name} moved to Party Storage`,'info');
  });
}

const _dt19RenderInventory=renderInventory;
renderInventory=function(){
  dt19EnsureState();
  _dt19RenderInventory();
  const host=el('inventoryList'); const c=getChar();
  host?.querySelectorAll('[data-inspect-inv]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.inspectInv;dt19ShowItem(c.inventory[i],{character:c,inventoryIndex:i});}));
  dt19RenderEquipment(); dt19RenderPartyStash();
};

const _dt19RenderShop=renderShop;
renderShop=function(){
  _dt19RenderShop();
  const host=el('shopList'); if(!host)return;
  host.querySelectorAll('.shop-item-card').forEach(card=>{
    if(card.querySelector('.dt19-shop-inspect')) return;
    const name=card.querySelector('.shop-item-name')?.textContent?.trim();
    const item=findTowerShopItem(name); if(!item)return;
    const btn=document.createElement('button'); btn.type='button'; btn.className='dt19-shop-inspect'; btn.textContent='DETAILS';
    btn.addEventListener('click',e=>{e.stopPropagation();dt19ShowItem({...item,value:Math.floor((Number(item.price)||0)*.5)});});
    card.querySelector('.shop-item-foot')?.appendChild(btn);
  });
};

// ------------------------------ SKILL TREE -----------------------------------
function dt19RenderSkillTree(){
  const tab=document.querySelector('.tab-content[data-tab="abilities"]'); if(!tab)return;
  let host=el('dt19SkillTree');
  if(!host){host=document.createElement('section');host.id='dt19SkillTree';host.className='dt19-skill-tree';tab.prepend(host);}
  const c=getChar(); if(!c)return; dt19EnsureCharacter(c);
  const nodes=[...c.skillTreeNodes].sort((a,b)=>a.tier-b.tier||a.name.localeCompare(b.name));
  host.innerHTML=`<div class="panel-title dt19-section-title">Skill Tree <span>${nodes.filter(n=>n.status==='learned').length} learned</span></div>
    ${nodes.length?`<div class="dt19-skill-tree-grid">${nodes.map(n=>{const pre=nodes.find(x=>x.id===n.prerequisiteId);return `<article class="dt19-skill-node status-${n.status}" style="--node-tier:${n.tier}"><div class="dt19-skill-node-top"><span>T${n.tier}</span><b>${esc(n.name)}</b><em>${n.status.toUpperCase()}</em></div><p>${esc(n.desc||'No description.')}</p>${pre?`<small>REQUIRES: ${esc(pre.name)}</small>`:''}</article>`;}).join('')}</div>`:'<div class="empty-note">No skill tree has been configured by the Game Master.</div>'}`;
}
const _dt19RenderAbilities=renderAbilities;
renderAbilities=function(){_dt19RenderAbilities();dt19RenderSkillTree();};

function dt19SkillTreeDmHtml(charOpts){
  return `<div class="dm-card dt19-skilltree-manager"><div class="dm-card-title"><span>🌿 Skill Tree Manager</span><small>PLAYER PROGRESSION NODES</small></div><div class="dm-card-body">
    <div class="dt19-form-grid"><select id="dt19SkillTarget">${charOpts}</select><input id="dt19SkillNodeName" placeholder="Node name"><input id="dt19SkillNodeTier" type="number" min="1" value="1"><select id="dt19SkillNodeStatus"><option value="locked">Locked</option><option value="available">Available</option><option value="learned">Learned</option></select></div>
    <textarea id="dt19SkillNodeDesc" rows="2" placeholder="What this node grants or represents"></textarea>
    <div class="dt19-inline-actions"><select id="dt19SkillNodePrereq"><option value="">— No prerequisite —</option></select><button class="maw-btn small" id="dt19SkillNodeAdd">＋ ADD NODE</button></div>
    <div id="dt19SkillNodeList" class="dt19-manager-list"></div>
  </div></div>`;
}
function dt19RenderDmSkillTree(){
  const target=el('dt19SkillTarget'), host=el('dt19SkillNodeList'); if(!target||!host)return;
  const c=state.characters[Number(target.value)]; if(!c)return; dt19EnsureCharacter(c);
  const pre=el('dt19SkillNodePrereq'); if(pre) pre.innerHTML='<option value="">— No prerequisite —</option>'+c.skillTreeNodes.map(n=>`<option value="${esc(n.id)}">T${n.tier} · ${esc(n.name)}</option>`).join('');
  host.innerHTML=c.skillTreeNodes.length?c.skillTreeNodes.sort((a,b)=>a.tier-b.tier).map((n,i)=>`<div class="dt19-manager-row"><div><b>T${n.tier} · ${esc(n.name)}</b><span>${esc(n.desc||'')}</span></div><select data-skill-status="${i}"><option value="locked" ${n.status==='locked'?'selected':''}>Locked</option><option value="available" ${n.status==='available'?'selected':''}>Available</option><option value="learned" ${n.status==='learned'?'selected':''}>Learned</option></select><button data-skill-del="${i}">✕</button></div>`).join(''):'<div class="dm-empty">No nodes configured.</div>';
  host.querySelectorAll('[data-skill-status]').forEach(s=>s.addEventListener('change',()=>{c.skillTreeNodes[+s.dataset.skillStatus].status=s.value;pushState(true);dt19RenderDmSkillTree();renderAbilities();}));
  host.querySelectorAll('[data-skill-del]').forEach(b=>b.addEventListener('click',()=>{const n=c.skillTreeNodes[+b.dataset.skillDel];c.skillTreeNodes.splice(+b.dataset.skillDel,1);c.skillTreeNodes.forEach(x=>{if(x.prerequisiteId===n?.id)x.prerequisiteId='';});pushState(true);dt19RenderDmSkillTree();}));
}
function dt19BindDmSkillTree(){
  el('dt19SkillTarget')?.addEventListener('change',dt19RenderDmSkillTree);
  el('dt19SkillNodeAdd')?.addEventListener('click',()=>{
    const c=state.characters[Number(el('dt19SkillTarget')?.value)]; const name=el('dt19SkillNodeName')?.value?.trim(); if(!c||!name){showToast('Choose a player and name the skill node','warn');return;}
    c.skillTreeNodes.push({id:dt19Id('skillnode'),name,desc:el('dt19SkillNodeDesc')?.value||'',tier:Math.max(1,Number(el('dt19SkillNodeTier')?.value)||1),prerequisiteId:el('dt19SkillNodePrereq')?.value||'',status:el('dt19SkillNodeStatus')?.value||'locked'});
    pushState(true); el('dt19SkillNodeName').value=''; el('dt19SkillNodeDesc').value=''; dt19RenderDmSkillTree();
  });
  dt19RenderDmSkillTree();
}

// ------------------------------ QUEST ACCEPTANCE -----------------------------
function dt19QuestVisibleTo(c,q){
  return q.assignedTo==='all'||(Array.isArray(q.assignedTo)&&q.assignedTo.includes(String(c.id)))||(!q.assignedTo||(Array.isArray(q.assignedTo)&&!q.assignedTo.length));
}
function dt19QuestAccepted(c,q){return q.requireAcceptance===false || (q.acceptedBy||[]).includes(String(c.id));}
function dt19QuestPrereqMet(q){
  if(!q.prerequisiteQuestId)return true;
  return !!(state.cases||[]).find(x=>String(x.id)===String(q.prerequisiteQuestId)&&x.status==='completed');
}
function dt19CanAcceptQuest(c,q){
  if((DT19_RANK_ORDER[c.rank]??0)<(DT19_RANK_ORDER[q.minimumRank]??0)) return {ok:false,reason:`Requires ${q.minimumRank}-Rank`};
  if(!dt19QuestPrereqMet(q)) return {ok:false,reason:'Prerequisite quest incomplete'};
  return {ok:true,reason:''};
}
function dt19AcceptQuest(id){
  const c=getChar(), q=(state.cases||[]).find(x=>String(x.id)===String(id)); if(!c||!q)return;
  const check=dt19CanAcceptQuest(c,q); if(!check.ok){showToast(check.reason,'warn');return;}
  if(!Array.isArray(q.acceptedBy))q.acceptedBy=[];
  if(!q.acceptedBy.includes(String(c.id)))q.acceptedBy.push(String(c.id));
  if(q.status==='available')q.status='active';
  pushState(true);renderQuestLog();showToast(`Quest accepted: ${q.name}`,'buy');
}
function dt19RenderQuestLog(){
  const c=getChar(); if(!c)return; const host=el('questList'); if(!host)return; dt19EnsureState();
  const quests=(state.cases||[]).filter(q=>dt19QuestVisibleTo(c,q)&&q.status!=='completed'&&q.status!=='failed');
  const activeCount=quests.filter(q=>dt19QuestAccepted(c,q)).length, offeredCount=quests.length-activeCount;
  if(el('questStats'))el('questStats').innerHTML=`<span class="qstat"><strong>${activeCount}</strong> Accepted</span><span class="qstat"><strong>${offeredCount}</strong> Offered</span><span class="qstat completed"><strong>${(state.cases||[]).filter(q=>q.status==='completed').length}</strong> Completed</span>`;
  const filterEl=el('questFilters'); if(filterEl){filterEl.innerHTML=`<button class="quest-type-filter active" data-qtype="all">All</button>`+Object.entries(QUEST_TYPES).map(([k,v])=>`<button class="quest-type-filter" data-qtype="${k}" style="--qt-c:${v.color}">${v.icon} ${v.label}</button>`).join('');filterEl.querySelectorAll('.quest-type-filter').forEach(btn=>btn.addEventListener('click',()=>{filterEl.querySelectorAll('.quest-type-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');host.querySelectorAll('.quest-card').forEach(card=>card.style.display=(btn.dataset.qtype==='all'||card.dataset.qtype===btn.dataset.qtype)?'':'none');}));}
  if(!quests.length){host.innerHTML='<div class="empty-note big">📜<br>NO QUEST OFFERS<br><span>The Game Master has not assigned any quests to you.</span></div>';return;}
  host.innerHTML=quests.map(q=>{
    const qt=QUEST_TYPES[q.type]||QUEST_TYPES.side,rk=RANK_BY_ID[q.rank]||RANKS[0],accepted=dt19QuestAccepted(c,q),check=dt19CanAcceptQuest(c,q);
    const visibleHidden=(q.hiddenObjectives||[]).filter(o=>o.revealed), optional=(q.optionalObjectives||[]), objectives=[...(q.objectives||[]),...optional,...visibleHidden];
    const doneCt=objectives.filter(o=>o.done).length,pct=objectives.length?Math.round(doneCt/objectives.length*100):0;
    return `<div class="quest-card ${accepted?'active':'available'}" data-qtype="${q.type}" style="--qt-c:${qt.color};--qr-c:${rk.color}"><div class="qc-head"><span class="qc-type" style="color:${qt.color}">${qt.icon}</span><span class="qc-name">${esc(q.name)}</span><span class="qc-rank" style="color:${rk.color};border-color:${rk.color}">${rk.id}</span><span class="qc-status-tag ${accepted?'active':'available'}">${accepted?'ACCEPTED':'OFFERED'}</span></div>
      ${q.desc?`<div class="qc-desc">${esc(q.desc)}</div>`:''}
      ${(q.requirements||[]).length?`<div class="qc-requirements"><span>REQUIREMENTS</span>${q.requirements.map(r=>`<b>◇ ${esc(r)}</b>`).join('')}</div>`:''}
      ${(q.failureConditions||[]).length?`<div class="qc-failures"><span>FAILURE CONDITIONS</span>${q.failureConditions.map(r=>`<b>× ${esc(r)}</b>`).join('')}</div>`:''}
      ${objectives.length?`<div class="qc-progress"><div class="qc-progress-bar"><div class="qc-progress-fill" style="width:${pct}%"></div></div><span class="qc-progress-text">${doneCt}/${objectives.length}</span></div><div class="qc-objectives">${objectives.map(o=>`<div class="qc-obj ${o.done?'done':''}"><span class="qc-obj-check">${o.done?'✓':'○'}</span><span>${esc(o.text)}</span>${(q.optionalObjectives||[]).includes(o)?'<em>OPTIONAL</em>':(q.hiddenObjectives||[]).includes(o)?'<em>REVEALED</em>':''}</div>`).join('')}</div>`:''}
      ${(q.rewards.exp||q.rewards.gold||(q.rewards.items||[]).length)?`<div class="qc-rewards"><span class="qc-rewards-label">REWARDS:</span>${q.rewards.exp?`<span class="qc-reward exp">✦ ${fmtGold(q.rewards.exp)} EXP</span>`:''}${q.rewards.gold?`<span class="qc-reward gold">◆ ${fmtGold(q.rewards.gold)} Gold</span>`:''}${(q.rewards.items||[]).map(it=>{const r=typeof it==='object'?it:{name:String(it),qty:1};return `<span class="qc-reward item">📦 ${esc(r.name)}${(Number(r.qty)||1)>1?` ×${Number(r.qty)||1}`:''}</span>`;}).join('')}</div>`:''}
      ${q.timeLimit?`<div class="qc-time">⏱ ${esc(q.timeLimit)}</div>`:''}
      ${!accepted?`<div class="dt19-quest-accept"><button class="maw-btn small" data-accept-quest="${esc(q.id)}" ${check.ok?'':'disabled'}>${check.ok?'ACCEPT QUEST':esc(check.reason)}</button></div>`:''}</div>`;
  }).join('');
  host.querySelectorAll('[data-accept-quest]').forEach(b=>b.addEventListener('click',()=>dt19AcceptQuest(b.dataset.acceptQuest)));
  el('questShowCompleted')?.addEventListener('click',()=>{const list=el('questCompletedList');if(!list)return;const showing=list.style.display!=='none';list.style.display=showing?'none':'';el('questShowCompleted').textContent=showing?'Show Completed':'Hide Completed';if(!showing){const done=(state.cases||[]).filter(q=>q.status==='completed'||q.status==='failed');list.innerHTML=done.length?done.map(q=>`<div class="quest-card completed-card ${q.status}"><div class="qc-head"><span class="qc-name">${esc(q.name)}</span><span class="qc-status-tag ${q.status}">${q.status.toUpperCase()}</span></div></div>`).join(''):'<div class="empty-note">No completed quests yet.</div>';}});
}
renderQuestLog=dt19RenderQuestLog;

function dt19QuestTargets(q){
  const assigned=q.assignedTo==='all'?state.characters.filter(c=>c.state==='active'):state.characters.filter(c=>Array.isArray(q.assignedTo)&&q.assignedTo.includes(String(c.id)));
  return q.requireAcceptance===false?assigned:assigned.filter(c=>(q.acceptedBy||[]).includes(String(c.id)));
}
function dt19UnlockNextQuest(q){
  if(!q?.chainNextId)return;
  const next=(state.cases||[]).find(x=>String(x.id)===String(q.chainNextId));
  if(next&&next.status!=='completed'&&next.status!=='failed')next.status='available';
}
function dt19GrantQuestRewards(q){
  if(q.rewardsGranted)return;
  const targets=dt19QuestTargets(q), items=Array.isArray(q.rewards?.items)?q.rewards.items:[];
  targets.forEach(c=>{if(q.rewards.exp)gainExp(c,q.rewards.exp);if(q.rewards.gold)c.points=(c.points||0)+q.rewards.gold;items.forEach(r=>{const rr=typeof r==='object'?r:{name:String(r),qty:1};if(rr.name)giveTowerShopItem(c,rr.name,Math.max(1,Number(rr.qty)||1),'quest',q.name);});});
  q.rewardsGranted=true;
}
function dt19RenderDmQuestList(){
  const host=el('dmQuestList'); if(!host)return; dt19EnsureState(); const quests=state.cases||[];
  if(!quests.length){host.innerHTML='<div class="dm-empty">No quests created yet.</div>';return;}
  host.innerHTML=quests.map((q,i)=>{const qt=QUEST_TYPES[q.type]||QUEST_TYPES.side,rk=RANK_BY_ID[q.rank]||RANKS[0];return `<div class="dm-quest-row dt19-dm-quest" style="--qt-c:${qt.color}"><div class="dm-quest-top"><span>${qt.icon}</span><b>${esc(q.name)}</b><span class="dm-quest-rank" style="color:${rk.color}">${rk.id}</span><select class="dm-quest-status" data-qi="${i}"><option value="available" ${q.status==='available'?'selected':''}>Available</option><option value="active" ${q.status==='active'?'selected':''}>Active</option><option value="completed" ${q.status==='completed'?'selected':''}>Completed</option><option value="failed" ${q.status==='failed'?'selected':''}>Failed</option></select><button class="dm-quest-del" data-qi="${i}">✕</button></div>
    ${q.desc?`<p class="dt19-dm-quest-desc">${esc(q.desc)}</p>`:''}<div class="dt19-quest-meta"><span>MIN ${q.minimumRank}-RANK</span><span>${q.requireAcceptance===false?'AUTO-ASSIGNED':'ACCEPTANCE REQUIRED'}</span><span>${(q.acceptedBy||[]).length} ACCEPTED</span>${q.timeLimit?`<span>⏱ ${esc(q.timeLimit)}</span>`:''}</div>
    ${(q.objectives||[]).length?`<div class="dm-quest-objs">${q.objectives.map((o,oi)=>`<label class="dm-quest-obj"><input type="checkbox" ${o.done?'checked':''} data-qi="${i}" data-oi="${oi}" data-kind="normal"> ${esc(o.text)}</label>`).join('')}</div>`:''}${(q.optionalObjectives||[]).length?`<div class="dt19-optional-objectives"><b>OPTIONAL OBJECTIVES</b>${q.optionalObjectives.map((o,oi)=>`<label class="dm-quest-obj"><input type="checkbox" ${o.done?'checked':''} data-qi="${i}" data-oi="${oi}" data-kind="optional"> ${esc(o.text)}</label>`).join('')}</div>`:''}
    ${(q.hiddenObjectives||[]).length?`<div class="dt19-hidden-objectives"><b>HIDDEN OBJECTIVES</b>${q.hiddenObjectives.map((o,oi)=>`<div class="dt19-hidden-row"><label><input type="checkbox" ${o.done?'checked':''} data-qi="${i}" data-oi="${oi}" data-kind="hidden"> ${esc(o.text)}</label><button class="dt19-reveal-hidden ${o.revealed?'on':''}" data-qi="${i}" data-hi="${oi}" type="button">${o.revealed?'REVEALED':'REVEAL'}</button></div>`).join('')}</div>`:''}
    ${(q.failureConditions||[]).length?`<div class="dt19-failure-list"><b>FAIL IF</b>${q.failureConditions.map(x=>`<span>× ${esc(x)}</span>`).join('')}</div>`:''}
    ${(q.rewards.exp||q.rewards.gold||(q.rewards.items||[]).length)?`<div class="dm-quest-rewards">Rewards: ${q.rewards.exp?`✦ ${fmtGold(q.rewards.exp)} EXP `:''}${q.rewards.gold?`◆ ${fmtGold(q.rewards.gold)} Gold `:''}${(q.rewards.items||[]).map(it=>`📦 ${esc(it.name||it)}`).join(' ')}</div>`:''}</div>`;}).join('');
  host.querySelectorAll('.dm-quest-status').forEach(sel=>sel.addEventListener('change',()=>{const q=state.cases[+sel.dataset.qi];if(!q)return;const old=q.status;q.status=sel.value;if(q.status==='completed'&&old!=='completed'){dt19GrantQuestRewards(q);dt19UnlockNextQuest(q);}pushState(true);render();dt19RenderDmQuestList();}));
  host.querySelectorAll('.dm-quest-obj input').forEach(cb=>cb.addEventListener('change',()=>{const q=state.cases[+cb.dataset.qi];if(!q)return;const arr=cb.dataset.kind==='hidden'?q.hiddenObjectives:cb.dataset.kind==='optional'?q.optionalObjectives:q.objectives;const o=arr?.[+cb.dataset.oi];if(o)o.done=cb.checked;pushState(true);}));
  host.querySelectorAll('.dt19-reveal-hidden').forEach(b=>b.addEventListener('click',()=>{const q=state.cases[+b.dataset.qi],o=q?.hiddenObjectives?.[+b.dataset.hi];if(!o)return;o.revealed=!o.revealed;pushState(true);dt19RenderDmQuestList();renderQuestLog();}));
  host.querySelectorAll('.dm-quest-del').forEach(btn=>btn.addEventListener('click',()=>{const q=state.cases[+btn.dataset.qi];if(!confirm(`Delete quest "${q?.name||'Untitled'}"?`))return;state.cases.splice(+btn.dataset.qi,1);pushState(true);dt19RenderDmQuestList();showToast('Quest deleted','info');}));
}
renderDmQuestList=dt19RenderDmQuestList;

function dt19EnhanceQuestBuilder(){
  const builder=document.querySelector('.dm-quest-builder .dm-card-body'); if(!builder||el('dt19QuestAdvanced'))return;
  const adv=document.createElement('section');adv.id='dt19QuestAdvanced';adv.className='dt19-quest-builder-advanced';
  adv.innerHTML=`<div class="dt19-builder-label">ADVANCED QUEST RULES</div><div class="dt19-form-grid"><label><span>Minimum Rank</span><select id="dt19QuestMinRank">${RANKS.map(r=>`<option value="${r.id}">${r.id}-Rank</option>`).join('')}</select></label><label><span>Prerequisite</span><select id="dt19QuestPrereq"><option value="">None</option>${(state.cases||[]).map(q=>`<option value="${esc(q.id)}">${esc(q.name)}</option>`).join('')}</select></label><label><span>Next Quest in Chain</span><select id="dt19QuestNext"><option value="">None</option>${(state.cases||[]).map(q=>`<option value="${esc(q.id)}">${esc(q.name)}</option>`).join('')}</select></label><label class="dt19-check-field"><input id="dt19QuestRequireAccept" type="checkbox" checked> Player must accept</label></div><div class="dt19-two-col"><label><span>Optional Objectives · one per line</span><textarea id="dt19QuestOptionalObjectives" rows="3" placeholder="Optional bonus objective"></textarea></label><label><span>Hidden Objectives · one per line</span><textarea id="dt19QuestHiddenObjectives" rows="3" placeholder="Secret objective"></textarea></label><label><span>Failure Conditions · one per line</span><textarea id="dt19QuestFailures" rows="3" placeholder="Fail if the escort dies"></textarea></label></div>`;
  const createRow=el('dmQuestCreateBtn')?.parentElement; if(createRow) builder.insertBefore(adv,createRow); else builder.appendChild(adv);
  el('dmQuestCreateBtn')?.addEventListener('click',()=>{
    setTimeout(()=>{
      const q=[...(state.cases||[])].sort((a,b)=>(b.created||0)-(a.created||0))[0]; if(!q)return;
      q.optionalObjectives=(el('dt19QuestOptionalObjectives')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean).map(text=>({id:dt19Id('optional'),text,done:false}));
      q.hiddenObjectives=(el('dt19QuestHiddenObjectives')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean).map(text=>({id:dt19Id('hidden'),text,done:false,revealed:false}));
      q.failureConditions=(el('dt19QuestFailures')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);
      q.minimumRank=el('dt19QuestMinRank')?.value||'E';q.prerequisiteQuestId=el('dt19QuestPrereq')?.value||'';q.chainNextId=el('dt19QuestNext')?.value||'';q.requireAcceptance=!!el('dt19QuestRequireAccept')?.checked;q.acceptedBy=[];q.declinedBy=[];
      pushState(true);el('dt19QuestOptionalObjectives').value='';el('dt19QuestHiddenObjectives').value='';el('dt19QuestFailures').value='';dt19RenderDmQuestList();
    },0);
  });
}

// ------------------------------ PERSONAL QUEST SYSTEM ------------------------
function dt19GrantSystemQuestRewards(c,q){
  if(q.rewardGranted)return;
  if(q.rewards.exp)gainExp(c,q.rewards.exp);if(q.rewards.gold)c.points=(c.points||0)+q.rewards.gold;
  (q.rewards.items||[]).forEach(r=>{if(r.name)giveTowerShopItem(c,r.name,Math.max(1,Number(r.qty)||1),'quest',q.name);});q.rewardGranted=true;
}
function dt19RenderQuestSystemPlayer(host,c,ps,def){
  const qs=ps.quest.systemQuests||[];
  host.innerHTML=`<section class="system-shell type-quest"><header class="system-hero"><div class="system-sigil">${def.icon}</div><div><span>PERSONAL SYSTEM</span><h2>${esc(ps.name||def.name)}</h2><p>${esc(ps.description||'A personal directive System. These quests are separate from party quests and must be accepted by you.')}</p></div></header>
  <div class="quest-system-banner"><div><span>QUEST COMPLEXITY</span><strong>LEVEL ${ps.quest.complexityLevel}</strong></div><div><span>PERSONAL DIRECTIVES</span><strong>${qs.length}</strong></div></div>${ps.quest.requirementNotes?`<div class="system-rule"><b>SYSTEM REQUIREMENTS</b><p>${esc(ps.quest.requirementNotes)}</p></div>`:''}
  <div class="system-quest-stack">${qs.length?qs.map(q=>{const shown=[...(q.objectives||[]),...(q.hiddenObjectives||[]).filter(o=>o.revealed)];return `<article class="system-quest-card dt19-system-quest ${q.status}"><header><b>${esc(q.name)}</b><span>${esc(q.rank)}</span></header><p>${esc(q.desc||'')}</p>${(q.requirements||[]).length?`<div class="sys-reqs">${q.requirements.map(r=>`<span>◇ ${esc(r)}</span>`).join('')}</div>`:''}${shown.length?`<div class="dt19-sys-objectives">${shown.map(o=>`<span class="${o.done?'done':''}">${o.done?'✓':'○'} ${esc(o.text)}</span>`).join('')}</div>`:''}${(q.failureConditions||[]).length?`<div class="dt19-sys-fail">${q.failureConditions.map(x=>`<span>× ${esc(x)}</span>`).join('')}</div>`:''}${q.timeLimit?`<small>⏱ ${esc(q.timeLimit)}</small>`:''}<div class="dt19-system-quest-status">${q.status==='offered'?`<button class="maw-btn small" data-accept-system-quest="${esc(q.id)}">ACCEPT DIRECTIVE</button>`:`<b>${q.status.toUpperCase()}</b>`}</div></article>`;}).join(''):'<div class="sys-muted">No personal System quests are waiting.</div>'}</div></section>`;
  host.querySelectorAll('[data-accept-system-quest]').forEach(b=>b.addEventListener('click',()=>{const q=qs.find(x=>x.id===b.dataset.acceptSystemQuest);if(!q)return;q.accepted=true;q.status='active';pushState(true);renderPersonalSystem();showToast(`System Quest accepted: ${q.name}`,'buy');}));
}
const _dt19RenderPersonalSystem=renderPersonalSystem;
renderPersonalSystem=function(){
  const c=getChar(); if(!c)return _dt19RenderPersonalSystem(); const ps=ensurePersonalSystem(c);
  if(ps.type!=='quest')return _dt19RenderPersonalSystem();
  dt19EnsureCharacter(c);const host=el('personalSystemHost');if(!host)return;const def=PERSONAL_SYSTEM_TYPES.quest;dt19RenderQuestSystemPlayer(host,c,ps,def);
};

const _dt19RenderDmSystemEditor=renderDmSystemEditor;
renderDmSystemEditor=function(){
  const sel=el('dmSystemTarget');const c=sel?state.characters[Number(sel.value)]:null;if(!c)return _dt19RenderDmSystemEditor();const ps=ensurePersonalSystem(c);
  if(ps.type!=='quest')return _dt19RenderDmSystemEditor();
  dt19EnsureCharacter(c);const host=el('dmSystemEditor');if(!host)return;
  if(el('dmSystemType'))el('dmSystemType').value=ps.type;if(el('dmSystemName'))el('dmSystemName').value=ps.name||'';if(el('dmSystemDesc'))el('dmSystemDesc').value=ps.description||'';
  const itemOpts=(typeof getDefaultTowerShop==='function'?getDefaultTowerShop():state.shop||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(it=>`<option value="${esc(it.name)}">${esc(it.name)}</option>`).join('');
  host.innerHTML=`<div class="dm-system-summary"><b>${esc(c.name||'Player')}</b><span>Personal Quest System · directives are private and separate from party/group quests</span></div>
    <div class="dt19-form-grid"><label class="dm-field-label">Complexity Level<input type="number" id="dmQuestComplexity" min="1" value="${ps.quest.complexityLevel}"></label><label class="dm-field-label dt19-span-2">Standing Requirements<textarea id="dmQuestReqNotes" rows="2">${esc(ps.quest.requirementNotes)}</textarea></label><button class="maw-btn small" id="dmQuestSystemSave">SAVE SYSTEM</button></div>
    <div class="dt19-systemquest-builder"><h4>CREATE PERSONAL SYSTEM QUEST</h4><input id="dt19SQName" placeholder="Quest name"><textarea id="dt19SQDesc" rows="2" placeholder="Directive / briefing"></textarea><div class="dt19-form-grid"><select id="dt19SQRank">${RANKS.map(r=>`<option value="${r.id}">${r.id}-Rank</option>`).join('')}</select><input id="dt19SQTime" placeholder="Time limit"><input id="dt19SQExp" type="number" min="0" placeholder="EXP"><input id="dt19SQGold" type="number" min="0" placeholder="Gold"></div><div class="dt19-two-col"><textarea id="dt19SQObjectives" rows="3" placeholder="Objectives · one per line"></textarea><textarea id="dt19SQHidden" rows="3" placeholder="Hidden objectives · one per line"></textarea><textarea id="dt19SQRequirements" rows="3" placeholder="Requirements · one per line"></textarea><textarea id="dt19SQFailures" rows="3" placeholder="Failure conditions · one per line"></textarea></div><div class="dt19-inline-actions"><select id="dt19SQItem"><option value="">— Optional item reward —</option>${itemOpts}</select><input id="dt19SQItemQty" type="number" min="1" value="1"><button class="maw-btn small" id="dt19SQCreate">＋ CREATE DIRECTIVE</button></div></div>
    <div class="dt19-manager-list" id="dt19SQList">${ps.quest.systemQuests.length?ps.quest.systemQuests.map((q,i)=>`<div class="dt19-manager-row dt19-systemquest-row"><div><b>${esc(q.name)}</b><span>${q.rank}-Rank · ${q.accepted?'Accepted':'Awaiting acceptance'}</span></div><select data-sq-status="${i}"><option value="offered" ${q.status==='offered'?'selected':''}>Offered</option><option value="active" ${q.status==='active'?'selected':''}>Active</option><option value="completed" ${q.status==='completed'?'selected':''}>Completed</option><option value="failed" ${q.status==='failed'?'selected':''}>Failed</option></select><button data-sq-del="${i}">✕</button><div class="dt19-sq-detail">${(q.objectives||[]).length?`<div><b>OBJECTIVES</b>${q.objectives.map((o,oi)=>`<label><input type="checkbox" data-sq-obj="${i}:${oi}" ${o.done?'checked':''}> ${esc(o.text)}</label>`).join('')}</div>`:''}${(q.hiddenObjectives||[]).length?`<div><b>HIDDEN OBJECTIVES</b>${q.hiddenObjectives.map((o,oi)=>`<span class="dt19-sq-hidden-line"><label><input type="checkbox" data-sq-hidden="${i}:${oi}" ${o.done?'checked':''}> ${esc(o.text)}</label><button type="button" data-sq-reveal="${i}:${oi}" class="${o.revealed?'on':''}">${o.revealed?'REVEALED':'REVEAL'}</button></span>`).join('')}</div>`:''}</div></div>`).join(''):'<div class="dm-empty">No personal directives created.</div>'}</div>`;
  el('dmQuestSystemSave')?.addEventListener('click',()=>{ps.quest.complexityLevel=Math.max(1,+el('dmQuestComplexity').value||1);ps.quest.requirementNotes=el('dmQuestReqNotes').value||'';pushState(true);renderDmSystemEditor();});
  el('dt19SQCreate')?.addEventListener('click',()=>{const name=el('dt19SQName').value.trim();if(!name){showToast('Name the System Quest','warn');return;}const lines=id=>(el(id).value||'').split('\n').map(x=>x.trim()).filter(Boolean);const item=el('dt19SQItem').value;ps.quest.systemQuests.push(dt19NormalizeSystemQuest({id:dt19Id('sysquest'),name,desc:el('dt19SQDesc').value,rank:el('dt19SQRank').value,status:'offered',accepted:false,objectives:lines('dt19SQObjectives').map(text=>({id:dt19Id('sqobj'),text,done:false})),hiddenObjectives:lines('dt19SQHidden').map(text=>({id:dt19Id('sqhidden'),text,done:false,revealed:false})),requirements:lines('dt19SQRequirements'),failureConditions:lines('dt19SQFailures'),timeLimit:el('dt19SQTime').value,rewards:{exp:+el('dt19SQExp').value||0,gold:+el('dt19SQGold').value||0,items:item?[{name:item,qty:Math.max(1,+el('dt19SQItemQty').value||1)}]:[]},created:Date.now()}));pushState(true);renderDmSystemEditor();showToast(`Personal directive created for ${c.name||'Player'}`,'buy');});
  host.querySelectorAll('[data-sq-status]').forEach(s=>s.addEventListener('change',()=>{const q=ps.quest.systemQuests[+s.dataset.sqStatus];if(!q)return;const old=q.status;q.status=s.value;if(q.status==='completed'&&old!=='completed')dt19GrantSystemQuestRewards(c,q);pushState(true);renderDmSystemEditor();renderPersonalSystem();}));
  host.querySelectorAll('[data-sq-obj]').forEach(x=>x.addEventListener('change',()=>{const [qi,oi]=x.dataset.sqObj.split(':').map(Number);const o=ps.quest.systemQuests[qi]?.objectives?.[oi];if(!o)return;o.done=x.checked;pushState(true);renderPersonalSystem();}));
  host.querySelectorAll('[data-sq-hidden]').forEach(x=>x.addEventListener('change',()=>{const [qi,oi]=x.dataset.sqHidden.split(':').map(Number);const o=ps.quest.systemQuests[qi]?.hiddenObjectives?.[oi];if(!o)return;o.done=x.checked;pushState(true);renderPersonalSystem();}));
  host.querySelectorAll('[data-sq-reveal]').forEach(b=>b.addEventListener('click',()=>{const [qi,oi]=b.dataset.sqReveal.split(':').map(Number);const o=ps.quest.systemQuests[qi]?.hiddenObjectives?.[oi];if(!o)return;o.revealed=!o.revealed;pushState(true);renderDmSystemEditor();renderPersonalSystem();}));
  host.querySelectorAll('[data-sq-del]').forEach(b=>b.addEventListener('click',()=>{ps.quest.systemQuests.splice(+b.dataset.sqDel,1);pushState(true);renderDmSystemEditor();}));
};

// ------------------------------ BESTIARY + LOOT ------------------------------
function dt19ParseLootTable(text){
  return String(text||'').split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{const p=line.split('|').map(x=>x.trim());return{name:p[0],chance:clamp(Number(p[1]??100)||0,0,100),qty:Math.max(1,Number(p[2]??1)||1)};}).filter(x=>x.name);
}
function dt19BestiaryHtml(charOpts){
  return `<div class="dm-tab-content" data-dmtab="bestiary"><div class="dt19-dm-split"><div class="dm-card"><div class="dm-card-title"><span>🐉 Bestiary Builder</span><small>MONSTER TEMPLATE</small></div><div class="dm-card-body"><div class="dt19-form-grid"><input id="dt19MonName" placeholder="Monster name"><select id="dt19MonRank">${RANKS.map(r=>`<option value="${r.id}">${r.id}-Rank</option>`).join('')}</select><input id="dt19MonType" placeholder="Type e.g. Beast"><input id="dt19MonHp" type="number" min="0" placeholder="HP"><input id="dt19MonAc" type="number" min="0" value="10" placeholder="AC"></div><textarea id="dt19MonDesc" rows="2" placeholder="Description / field notes"></textarea><textarea id="dt19MonAbilities" rows="3" placeholder="Abilities · one per line"></textarea><label class="dt19-block-label">Loot Table <small>Item Name | Chance % | Qty</small><textarea id="dt19MonLoot" rows="4" placeholder="Minor Health Potion | 60 | 1\nMonster Core (D-Rank) | 20 | 1"></textarea></label><button class="maw-btn small" id="dt19MonCreate">＋ SAVE MONSTER</button></div></div><div class="dm-card"><div class="dm-card-title"><span>📚 Bestiary</span><small id="dt19BestiaryCount"></small></div><div class="dm-card-body" id="dt19BestiaryList"></div></div></div></div>`;
}
function dt19GiveLoot(entry,target){
  const shop=findTowerShopItem(entry.name);const qty=Math.max(1,Number(entry.qty)||1);
  if(target==='stash'){
    if(shop)dt19AddToStash(inventoryItemFromShop(shop,qty,'party-stash'),qty);else dt19AddToStash({name:entry.name,qty,category:'Misc',rarity:'common',icon:'◆',value:0,description:'Bestiary loot'},qty);
  }else{
    const c=state.characters[Number(target)];if(!c)return;if(shop)giveTowerShopItem(c,shop,qty,'gm');else{dt19EnsureInventoryIds(c.inventory);c.inventory.push({id:dt19Id('loot'),name:entry.name,qty,category:'Misc',rarity:'common',icon:'◆',value:0,description:'Bestiary loot',source:'gm'});}
  }
}
function dt19RollMonsterLoot(mon,target){
  const drops=[];(mon.lootTable||[]).forEach(entry=>{if(Math.random()*100<=Number(entry.chance||0)){drops.push(entry);dt19GiveLoot(entry,target);}});pushState(true);showToast(drops.length?`Loot: ${drops.map(x=>`${x.name} ×${x.qty}`).join(', ')}`:'No loot dropped','info');dt19RenderBestiary();
}
function dt19RenderBestiary(){
  const host=el('dt19BestiaryList');if(!host)return;dt19EnsureState();if(el('dt19BestiaryCount'))el('dt19BestiaryCount').textContent=`${state.bestiary.length} ENTRIES`;
  host.innerHTML=state.bestiary.length?state.bestiary.map((m,i)=>`<article class="dt19-monster-card"><header><span class="dt19-mon-rank rank-${m.rank}">${m.rank}</span><div><b>${esc(m.name)}</b><small>${esc(m.type)} · HP ${m.hp} · AC ${m.ac}</small></div><button data-mon-del="${i}">✕</button></header>${m.desc?`<p>${esc(m.desc)}</p>`:''}${m.abilities.length?`<div class="dt19-mon-abilities">${m.abilities.map(a=>`<span>◆ ${esc(a)}</span>`).join('')}</div>`:''}<div class="dt19-loot-table"><b>LOOT TABLE</b>${m.lootTable.length?m.lootTable.map(l=>`<span>${esc(l.name)} <em>${l.chance}% · ×${l.qty}</em></span>`).join(''):'<span>No loot configured.</span>'}</div><div class="dt19-inline-actions"><select data-mon-target="${i}"><option value="stash">Party Storage</option>${state.characters.map((c,ci)=>`<option value="${ci}">${esc(c.name||`Player ${ci+1}`)}</option>`).join('')}</select><button class="maw-btn small" data-mon-roll="${i}">🎲 ROLL LOOT</button></div></article>`).join(''):'<div class="dm-empty">No monster templates yet.</div>';
  host.querySelectorAll('[data-mon-del]').forEach(b=>b.addEventListener('click',()=>{const m=state.bestiary[+b.dataset.monDel];if(!confirm(`Delete ${m?.name||'monster'}?`))return;state.bestiary.splice(+b.dataset.monDel,1);pushState(true);dt19RenderBestiary();}));
  host.querySelectorAll('[data-mon-roll]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.monRoll;const target=host.querySelector(`[data-mon-target="${i}"]`)?.value||'stash';dt19RollMonsterLoot(state.bestiary[i],target);}));
}
function dt19BindBestiary(){
  el('dt19MonCreate')?.addEventListener('click',()=>{const name=el('dt19MonName')?.value?.trim();if(!name){showToast('Name the monster first','warn');return;}state.bestiary.push({id:dt19Id('monster'),name,rank:el('dt19MonRank').value,type:el('dt19MonType').value||'Beast',hp:Math.max(0,+el('dt19MonHp').value||0),ac:Math.max(0,+el('dt19MonAc').value||10),desc:el('dt19MonDesc').value||'',abilities:(el('dt19MonAbilities').value||'').split('\n').map(x=>x.trim()).filter(Boolean),lootTable:dt19ParseLootTable(el('dt19MonLoot').value)});pushState(true);['dt19MonName','dt19MonType','dt19MonHp','dt19MonDesc','dt19MonAbilities','dt19MonLoot'].forEach(id=>{if(el(id))el(id).value='';});dt19RenderBestiary();showToast(`Bestiary entry saved: ${name}`,'buy');});dt19RenderBestiary();
}

// ------------------------------ NPC MANAGER ----------------------------------
function dt19NpcHtml(){
  return `<div class="dm-tab-content" data-dmtab="npcs"><div class="dt19-dm-split"><div class="dm-card"><div class="dm-card-title"><span>👥 NPC Manager</span><small>WORLD CONTACT DATABASE</small></div><div class="dm-card-body"><div class="dt19-form-grid"><input id="dt19NpcName" placeholder="Name"><input id="dt19NpcFaction" placeholder="Faction"><input id="dt19NpcLocation" placeholder="Location"><select id="dt19NpcStatus">${DT19_NPC_STATUSES.map(x=>`<option>${x}</option>`).join('')}</select><select id="dt19NpcAttitude">${DT19_NPC_ATTITUDES.map(x=>`<option>${x}</option>`).join('')}</select><label class="dt19-check-field"><input id="dt19NpcVisible" type="checkbox" checked> Visible to players</label></div><textarea id="dt19NpcNotes" rows="3" placeholder="Notes, role, secrets, personality"></textarea><button class="maw-btn small" id="dt19NpcCreate">＋ ADD NPC</button></div></div><div class="dm-card"><div class="dm-card-title">📇 NPC Directory</div><div class="dm-card-body" id="dt19NpcList"></div></div></div></div>`;
}
function dt19RenderNpcManager(){
  const host=el('dt19NpcList');if(!host)return;dt19EnsureState();host.innerHTML=state.npcs.length?state.npcs.map((n,i)=>`<article class="dt19-npc-row"><div><b>${esc(n.name)}</b><span>${esc(n.faction||'No faction')} · ${esc(n.location||'Unknown location')}</span></div><select data-npc-att="${i}">${DT19_NPC_ATTITUDES.map(x=>`<option ${n.attitude===x?'selected':''}>${x}</option>`).join('')}</select><select data-npc-status="${i}">${DT19_NPC_STATUSES.map(x=>`<option ${n.status===x?'selected':''}>${x}</option>`).join('')}</select><label class="dt19-visibility"><input type="checkbox" data-npc-visible="${i}" ${n.visibleToPlayers?'checked':''}> PLAYERS</label><button data-npc-del="${i}">✕</button>${n.notes?`<p>${esc(n.notes)}</p>`:''}</article>`).join(''):'<div class="dm-empty">No NPCs recorded.</div>';
  host.querySelectorAll('[data-npc-att]').forEach(s=>s.addEventListener('change',()=>{state.npcs[+s.dataset.npcAtt].attitude=s.value;pushState(true);dt19RenderNpcManager();dt19RenderNpcDirectory();}));host.querySelectorAll('[data-npc-status]').forEach(s=>s.addEventListener('change',()=>{state.npcs[+s.dataset.npcStatus].status=s.value;pushState(true);dt19RenderNpcManager();dt19RenderNpcDirectory();}));host.querySelectorAll('[data-npc-visible]').forEach(x=>x.addEventListener('change',()=>{state.npcs[+x.dataset.npcVisible].visibleToPlayers=x.checked;pushState(true);dt19RenderNpcDirectory();}));host.querySelectorAll('[data-npc-del]').forEach(b=>b.addEventListener('click',()=>{state.npcs.splice(+b.dataset.npcDel,1);pushState(true);dt19RenderNpcManager();dt19RenderNpcDirectory();}));
}
function dt19BindNpcManager(){
  el('dt19NpcCreate')?.addEventListener('click',()=>{const name=el('dt19NpcName')?.value?.trim();if(!name){showToast('Name the NPC first','warn');return;}state.npcs.push({id:dt19Id('npc'),name,faction:el('dt19NpcFaction').value||'',location:el('dt19NpcLocation').value||'',status:el('dt19NpcStatus').value,attitude:el('dt19NpcAttitude').value,notes:el('dt19NpcNotes').value||'',visibleToPlayers:!!el('dt19NpcVisible').checked});pushState(true);['dt19NpcName','dt19NpcFaction','dt19NpcLocation','dt19NpcNotes'].forEach(id=>{if(el(id))el(id).value='';});dt19RenderNpcManager();showToast(`${name} added to NPC directory`,'buy');});dt19RenderNpcManager();
}
function dt19RenderNpcDirectory(){
  const tab=document.querySelector('.tab-content[data-tab="relations"]');if(!tab)return;let host=el('dt19NpcDirectory');if(!host){host=document.createElement('section');host.id='dt19NpcDirectory';host.className='panel dt19-npc-directory';tab.appendChild(host);}const list=(state.npcs||[]).filter(n=>n.visibleToPlayers);host.innerHTML=`<div class="panel-title">Known NPCs <span>${list.length}</span></div>${list.length?`<div class="dt19-player-npc-grid">${list.map(n=>`<article><header><b>${esc(n.name)}</b><span>${esc(n.status)}</span></header><p>${esc(n.faction||'Independent')} · ${esc(n.location||'Location unknown')}</p><small>${esc(n.attitude)}</small></article>`).join('')}</div>`:'<div class="empty-note">No NPC records are currently visible.</div>'}`;
}
const _dt19RenderRelationships=renderRelationships;
renderRelationships=function(){_dt19RenderRelationships();dt19RenderNpcDirectory();};

// ------------------------------ DM PANEL INJECTION ---------------------------
function dt19WireInjectedTabs(content){
  content.querySelectorAll('.dm-tab[data-dt19-tab]').forEach(btn=>btn.addEventListener('click',()=>{content.querySelectorAll('.dm-tab').forEach(b=>b.classList.remove('active'));content.querySelectorAll('.dm-tab-content').forEach(c=>c.classList.remove('active'));btn.classList.add('active');content.querySelector(`.dm-tab-content[data-dmtab="${btn.dataset.dmtab}"]`)?.classList.add('active');}));
}
function dt19EnhanceDmPanel(){
  const content=el('dmContent');if(!content)return;dt19EnsureState();const tabs=content.querySelector('.dm-tabs');if(!tabs)return;
  const charOpts=state.characters.map((c,i)=>`<option value="${i}">${esc(c.name||`Player ${i+1}`)}</option>`).join('');
  if(!tabs.querySelector('[data-dmtab="bestiary"]'))tabs.insertAdjacentHTML('beforeend','<button class="dm-tab" data-dmtab="bestiary" data-dt19-tab>🐉 Bestiary</button>');
  if(!tabs.querySelector('[data-dmtab="npcs"]'))tabs.insertAdjacentHTML('beforeend','<button class="dm-tab" data-dmtab="npcs" data-dt19-tab>👥 NPCs</button>');
  const world=content.querySelector('.dm-tab-content[data-dmtab="world"]');
  if(world&&!content.querySelector('.dm-tab-content[data-dmtab="bestiary"]'))world.insertAdjacentHTML('beforebegin',dt19BestiaryHtml(charOpts));
  if(world&&!content.querySelector('.dm-tab-content[data-dmtab="npcs"]'))world.insertAdjacentHTML('beforebegin',dt19NpcHtml());
  const skills=content.querySelector('.dm-tab-content[data-dmtab="skills"]');if(skills&&!el('dt19SkillTreeDmHost')){const wrap=document.createElement('div');wrap.id='dt19SkillTreeDmHost';wrap.innerHTML=dt19SkillTreeDmHtml(charOpts);skills.prepend(wrap.firstElementChild);}
  dt19WireInjectedTabs(content);dt19EnhanceQuestBuilder();dt19BindBestiary();dt19BindNpcManager();dt19BindDmSkillTree();
}
const _dt19BuildDmPanelHtml=buildDmPanelHtml;
buildDmPanelHtml=function(){_dt19BuildDmPanelHtml();dt19EnhanceDmPanel();};
const _dt19RenderDmPanel=renderDmPanel;
renderDmPanel=function(){_dt19RenderDmPanel();dt19RenderBestiary();dt19RenderNpcManager();dt19RenderDmSkillTree();};

// Ensure new UI sections refresh after ordinary player renders without changing
// the existing render pipeline or tab behavior.
const _dt19Render=render;
render=function(){dt19EnsureState();_dt19Render();try{renderIdentityBar();dt19RenderEquipment();dt19RenderPartyStash();dt19RenderSkillTree();dt19RenderNpcDirectory();}catch(e){console.warn('[DT20 render enhancement]',e);}};

setTimeout(()=>{try{render();}catch(e){console.warn('[DT19 initial enhancement render]',e);}},0);
console.info('[DUNGEON TOWER] BUILD 20 loaded — stable character selection + UI polish');


// ============================================================================
// BUILD 21 — SYSTEM REWARD CLAIMS · EQUIPMENT PREVIEW · NOTIFICATION CENTER
// Stability-first additive layer. Campaign quests and Personal Quest System
// directives now create claimable rewards instead of silently mutating sheets.
// ============================================================================

function dt21EnsureCharacter(c){
  if(!c || typeof c!=='object') return c;
  dt19EnsureCharacter(c);
  if(!Array.isArray(c.systemNotifications)) c.systemNotifications=[];
  c.systemNotifications=c.systemNotifications.filter(Boolean).map((n,i)=>({
    id:String(n.id||dt19Id(`notice${i}`)),
    type:String(n.type||'system'),
    title:String(n.title||'SYSTEM NOTICE'),
    body:String(n.body||''),
    detail:String(n.detail||''),
    created:Number(n.created)||Date.now(),
    read:!!n.read,
    key:String(n.key||'')
  })).slice(-80);
  return c;
}
function dt21EnsureState(){
  dt19EnsureState();
  state.characters.forEach(dt21EnsureCharacter);
  (state.cases||[]).forEach(q=>{
    if(!q.rewardClaims || typeof q.rewardClaims!=='object' || Array.isArray(q.rewardClaims)) q.rewardClaims={};
    if(!q.rewardDistribution) q.rewardDistribution=q.rewardsGranted?'legacy-granted':'claim';
  });
}
dt21EnsureState();

const _dt21Normalize=normalize;
normalize=function(raw){
  const m=_dt21Normalize(raw);
  dt21EnsureState();
  return m;
};

function dt21CurrentCharIs(c){
  const cur=getChar?.();
  return !!cur && !!c && String(cur.id)===String(c.id);
}
function dt21NoticeIcon(type){
  return ({quest:'📜',reward:'✦',item:'◆',level:'▲',equipment:'⚔',system:'◇',warning:'!'})[type]||'◇';
}
function dt21Notify(c,type,title,body='',detail='',key=''){
  if(!c) return null;
  dt21EnsureCharacter(c);
  if(key && c.systemNotifications.some(n=>n.key===key)) return null;
  const n={id:dt19Id('notice'),type,title,body,detail,created:Date.now(),read:false,key};
  c.systemNotifications.push(n);
  if(c.systemNotifications.length>80)c.systemNotifications.splice(0,c.systemNotifications.length-80);
  if(dt21CurrentCharIs(c)) dt21ShowNotice(n);
  dt21RenderNoticeButton();
  return n;
}
let _dt21NoticeTimer=0;
function dt21ShowNotice(n){
  let host=el('dt21NoticeStack');
  if(!host){host=document.createElement('div');host.id='dt21NoticeStack';host.className='dt21-notice-stack';document.body.appendChild(host);}
  const card=document.createElement('div');
  card.className=`dt21-notice-card type-${n.type||'system'}`;
  card.innerHTML=`<span class="dt21-notice-icon">${dt21NoticeIcon(n.type)}</span><div><small>SYSTEM NOTICE</small><b>${esc(n.title)}</b>${n.body?`<p>${esc(n.body)}</p>`:''}</div>`;
  host.appendChild(card);
  requestAnimationFrame(()=>card.classList.add('show'));
  setTimeout(()=>{card.classList.remove('show');setTimeout(()=>card.remove(),250);},4300);
}
function dt21EnsureNotificationUi(){
  const actions=document.querySelector('.command-deck__actions');
  if(actions && !el('dt21NoticeBtn')){
    const b=document.createElement('button');b.id='dt21NoticeBtn';b.type='button';b.className='command-btn dt21-notice-btn';b.innerHTML='◇ NOTICES <span id="dt21NoticeCount">0</span>';actions.appendChild(b);
    b.addEventListener('click',dt21OpenNoticeCenter);
  }
  if(!el('dt21NoticeDrawer')){
    const d=document.createElement('div');d.id='dt21NoticeDrawer';d.className='dt21-notice-drawer hidden';
    d.innerHTML=`<div class="dt21-notice-shade" data-dt21-notice-close></div><aside><header><div><small>DUNGEON TOWER</small><h2>SYSTEM NOTICES</h2></div><button type="button" data-dt21-notice-close>✕</button></header><div id="dt21NoticeList"></div><footer><button type="button" class="maw-btn ghost small" id="dt21ClearRead">CLEAR READ</button></footer></aside>`;
    document.body.appendChild(d);
    d.addEventListener('click',e=>{if(e.target.closest('[data-dt21-notice-close]'))d.classList.add('hidden');});
    el('dt21ClearRead')?.addEventListener('click',()=>{const c=getChar();if(!c)return;c.systemNotifications=(c.systemNotifications||[]).filter(n=>!n.read);pushState(true);dt21RenderNoticeCenter();dt21RenderNoticeButton();});
  }
  dt21RenderNoticeButton();
}
function dt21RenderNoticeButton(){
  const c=getChar?.();const count=(c?.systemNotifications||[]).filter(n=>!n.read).length;
  const span=el('dt21NoticeCount');if(span)span.textContent=String(count);
  el('dt21NoticeBtn')?.classList.toggle('has-unread',count>0);
}
function dt21OpenNoticeCenter(){
  const c=getChar();if(!c)return;dt21EnsureCharacter(c);
  c.systemNotifications.forEach(n=>n.read=true);
  pushState(true);
  dt21RenderNoticeCenter();dt21RenderNoticeButton();
  el('dt21NoticeDrawer')?.classList.remove('hidden');
}
function dt21RenderNoticeCenter(){
  const c=getChar(),host=el('dt21NoticeList');if(!host)return;
  const notes=[...(c?.systemNotifications||[])].sort((a,b)=>b.created-a.created);
  host.innerHTML=notes.length?notes.map(n=>`<article class="dt21-notice-log type-${esc(n.type)}"><span>${dt21NoticeIcon(n.type)}</span><div><small>${new Date(n.created).toLocaleString()}</small><b>${esc(n.title)}</b>${n.body?`<p>${esc(n.body)}</p>`:''}${n.detail?`<em>${esc(n.detail)}</em>`:''}</div></article>`).join(''):'<div class="empty-note">No System notices.</div>';
}
let _dt21ShownNotices=new Set();
function dt21SyncRemoteNotices(){
  const c=getChar?.();if(!c)return;dt21EnsureCharacter(c);
  const fresh=(c.systemNotifications||[]).filter(n=>!n.read&&!_dt21ShownNotices.has(n.id)).sort((a,b)=>a.created-b.created).slice(-3);
  fresh.forEach(n=>{_dt21ShownNotices.add(n.id);dt21ShowNotice(n);});
  dt21RenderNoticeButton();
}

function dt21RewardSummary(q){
  const bits=[];
  if(q?.rewards?.exp)bits.push(`${fmtGold(q.rewards.exp)} EXP`);
  if(q?.rewards?.gold)bits.push(`${fmtGold(q.rewards.gold)} Gold`);
  (q?.rewards?.items||[]).forEach(raw=>{const r=typeof raw==='object'?raw:{name:String(raw),qty:1};if(r.name)bits.push(`${r.name}${(Number(r.qty)||1)>1?` ×${Number(r.qty)||1}`:''}`);});
  return bits.join(' · ')||'No listed rewards';
}
function dt21QueueQuestRewards(q){
  if(!q)return;
  dt21EnsureState();
  if(q.rewardsGranted && q.rewardDistribution==='legacy-granted') return;
  q.rewardDistribution='claim';
  const targets=dt19QuestTargets(q);
  targets.forEach(c=>{
    const id=String(c.id);
    if(q.rewardClaims[id]==='claimed'||q.rewardClaims[id]==='pending')return;
    q.rewardClaims[id]='pending';
    dt21Notify(c,'reward','QUEST COMPLETE',q.name,`Reward Cache: ${dt21RewardSummary(q)}`,`quest-complete:${q.id}:${id}`);
  });
}
function dt21ClaimQuestReward(q,c){
  if(!q||!c)return;
  dt21EnsureState();
  const id=String(c.id);
  if(q.rewardClaims?.[id]!=='pending'){showToast('No quest reward is waiting for this character.','warn');return;}
  if(q.rewards?.exp)gainExp(c,q.rewards.exp);
  if(q.rewards?.gold)c.points=(Number(c.points)||0)+Number(q.rewards.gold||0);
  (q.rewards?.items||[]).forEach(raw=>{const r=typeof raw==='object'?raw:{name:String(raw),qty:1};if(r.name)giveTowerShopItem(c,r.name,Math.max(1,Number(r.qty)||1),'quest',q.name);});
  q.rewardClaims[id]='claimed';
  const targets=dt19QuestTargets(q);
  if(targets.length && targets.every(x=>q.rewardClaims[String(x.id)]==='claimed'))q.rewardsGranted=true;
  dt21Notify(c,'reward','REWARDS CLAIMED',q.name,dt21RewardSummary(q),`quest-claimed:${q.id}:${id}`);
  pushState(true);render();showToast(`Rewards claimed: ${q.name}`,'buy');
}
function dt21RenderRewardInbox(){
  const c=getChar(),tab=document.querySelector('.tab-content[data-tab="cases"]');if(!c||!tab)return;
  let host=el('dt21RewardInbox');
  if(!host){host=document.createElement('section');host.id='dt21RewardInbox';host.className='dt21-reward-inbox';const list=el('questList');tab.insertBefore(host,list||tab.firstChild);}
  const pending=(state.cases||[]).filter(q=>q.status==='completed'&&q.rewardClaims?.[String(c.id)]==='pending');
  host.innerHTML=pending.length?`<div class="dt21-inbox-head"><div><small>SYSTEM DELIVERY</small><h3>PENDING QUEST REWARDS</h3></div><b>${pending.length}</b></div><div class="dt21-reward-grid">${pending.map(q=>`<article><div><small>QUEST COMPLETE</small><strong>${esc(q.name)}</strong><p>${esc(dt21RewardSummary(q))}</p></div><button type="button" class="maw-btn small" data-claim-q="${esc(q.id)}">CLAIM REWARDS</button></article>`).join('')}</div>`:'';
  host.style.display=pending.length?'':'none';
  host.querySelectorAll('[data-claim-q]').forEach(b=>b.addEventListener('click',()=>{const q=(state.cases||[]).find(x=>String(x.id)===String(b.dataset.claimQ));dt21ClaimQuestReward(q,c);}));
}

const _dt21BaseQuestLog=dt19RenderQuestLog;
function dt21RenderQuestLog(){
  _dt21BaseQuestLog();
  dt21RenderRewardInbox();
}
dt19RenderQuestLog=dt21RenderQuestLog;
renderQuestLog=dt21RenderQuestLog;

function dt21RenderDmQuestList(){
  const host=el('dmQuestList');if(!host)return;dt21EnsureState();const quests=state.cases||[];
  if(!quests.length){host.innerHTML='<div class="dm-empty">No quests created yet.</div>';return;}
  host.innerHTML=quests.map((q,i)=>{
    const qt=QUEST_TYPES[q.type]||QUEST_TYPES.side,rk=RANK_BY_ID[q.rank]||RANKS[0];
    const targets=dt19QuestTargets(q);
    const claimText=q.status==='completed'&&targets.length?targets.map(c=>`${esc(c.name||'Player')}: ${esc((q.rewardClaims?.[String(c.id)]||'not queued').toUpperCase())}`).join(' · '):'';
    return `<div class="dm-quest-row dt19-dm-quest" style="--qt-c:${qt.color}"><div class="dm-quest-top"><span>${qt.icon}</span><b>${esc(q.name)}</b><span class="dm-quest-rank" style="color:${rk.color}">${rk.id}</span><select class="dm-quest-status" data-qi="${i}"><option value="available" ${q.status==='available'?'selected':''}>Available</option><option value="active" ${q.status==='active'?'selected':''}>Active</option><option value="completed" ${q.status==='completed'?'selected':''}>Completed</option><option value="failed" ${q.status==='failed'?'selected':''}>Failed</option></select><button class="dm-quest-del" data-qi="${i}">✕</button></div>
    ${q.desc?`<p class="dt19-dm-quest-desc">${esc(q.desc)}</p>`:''}<div class="dt19-quest-meta"><span>MIN ${q.minimumRank}-RANK</span><span>${q.requireAcceptance===false?'AUTO-ASSIGNED':'ACCEPTANCE REQUIRED'}</span><span>${(q.acceptedBy||[]).length} ACCEPTED</span>${q.timeLimit?`<span>⏱ ${esc(q.timeLimit)}</span>`:''}</div>
    ${(q.objectives||[]).length?`<div class="dm-quest-objs">${q.objectives.map((o,oi)=>`<label class="dm-quest-obj"><input type="checkbox" ${o.done?'checked':''} data-qi="${i}" data-oi="${oi}" data-kind="normal"> ${esc(o.text)}</label>`).join('')}</div>`:''}${(q.optionalObjectives||[]).length?`<div class="dt19-optional-objectives"><b>OPTIONAL OBJECTIVES</b>${q.optionalObjectives.map((o,oi)=>`<label class="dm-quest-obj"><input type="checkbox" ${o.done?'checked':''} data-qi="${i}" data-oi="${oi}" data-kind="optional"> ${esc(o.text)}</label>`).join('')}</div>`:''}
    ${(q.hiddenObjectives||[]).length?`<div class="dt19-hidden-objectives"><b>HIDDEN OBJECTIVES</b>${q.hiddenObjectives.map((o,oi)=>`<div class="dt19-hidden-row"><label><input type="checkbox" ${o.done?'checked':''} data-qi="${i}" data-oi="${oi}" data-kind="hidden"> ${esc(o.text)}</label><button class="dt19-reveal-hidden ${o.revealed?'on':''}" data-qi="${i}" data-hi="${oi}" type="button">${o.revealed?'REVEALED':'REVEAL'}</button></div>`).join('')}</div>`:''}
    ${(q.failureConditions||[]).length?`<div class="dt19-failure-list"><b>FAIL IF</b>${q.failureConditions.map(x=>`<span>× ${esc(x)}</span>`).join('')}</div>`:''}
    ${(q.rewards?.exp||q.rewards?.gold||(q.rewards?.items||[]).length)?`<div class="dm-quest-rewards"><b>Reward Cache:</b> ${esc(dt21RewardSummary(q))}</div>`:''}${claimText?`<div class="dt21-dm-claim-state">${claimText}</div>`:''}</div>`;
  }).join('');
  host.querySelectorAll('.dm-quest-status').forEach(sel=>sel.addEventListener('change',()=>{const q=state.cases[+sel.dataset.qi];if(!q)return;const old=q.status;q.status=sel.value;if(q.status==='completed'&&old!=='completed'){dt21QueueQuestRewards(q);dt19UnlockNextQuest(q);}pushState(true);render();dt21RenderDmQuestList();}));
  host.querySelectorAll('.dm-quest-obj input').forEach(cb=>cb.addEventListener('change',()=>{const q=state.cases[+cb.dataset.qi];if(!q)return;const arr=cb.dataset.kind==='hidden'?q.hiddenObjectives:cb.dataset.kind==='optional'?q.optionalObjectives:q.objectives;const o=arr?.[+cb.dataset.oi];if(o)o.done=cb.checked;pushState(true);}));
  host.querySelectorAll('.dt19-reveal-hidden').forEach(b=>b.addEventListener('click',()=>{const q=state.cases[+b.dataset.qi],o=q?.hiddenObjectives?.[+b.dataset.hi];if(!o)return;o.revealed=!o.revealed;pushState(true);dt21RenderDmQuestList();renderQuestLog();}));
  host.querySelectorAll('.dm-quest-del').forEach(btn=>btn.addEventListener('click',()=>{const q=state.cases[+btn.dataset.qi];if(!confirm(`Delete quest "${q?.name||'Untitled'}"?`))return;state.cases.splice(+btn.dataset.qi,1);pushState(true);dt21RenderDmQuestList();showToast('Quest deleted','info');}));
}
dt19RenderDmQuestList=dt21RenderDmQuestList;
renderDmQuestList=dt21RenderDmQuestList;

// Personal Quest System: completion creates its own claimable System Reward Cache.
function dt21QueueSystemQuestReward(c,q){
  if(!c||!q||q.rewardGranted||q.rewardState==='claimed')return;
  q.rewardState='pending';
  dt21Notify(c,'system','SYSTEM DIRECTIVE COMPLETE',q.name,`Reward Cache: ${dt21RewardSummary(q)}`,`system-quest-complete:${q.id}`);
}
dt19GrantSystemQuestRewards=dt21QueueSystemQuestReward;
function dt21ClaimSystemQuestReward(c,q){
  if(!c||!q||q.rewardState!=='pending')return;
  if(q.rewards.exp)gainExp(c,q.rewards.exp);if(q.rewards.gold)c.points=(Number(c.points)||0)+Number(q.rewards.gold||0);
  (q.rewards.items||[]).forEach(r=>{if(r.name)giveTowerShopItem(c,r.name,Math.max(1,Number(r.qty)||1),'quest',q.name);});
  q.rewardState='claimed';q.rewardGranted=true;
  dt21Notify(c,'reward','SYSTEM REWARD CLAIMED',q.name,dt21RewardSummary(q),`system-quest-claimed:${q.id}`);
  pushState(true);renderPersonalSystem();render();
}
function dt21RenderQuestSystemPlayer(host,c,ps,def){
  const qs=ps.quest.systemQuests||[];
  host.innerHTML=`<section class="system-shell type-quest"><header class="system-hero"><div class="system-sigil">${def.icon}</div><div><span>PERSONAL SYSTEM</span><h2>${esc(ps.name||def.name)}</h2><p>${esc(ps.description||'A personal directive System. Directives belong only to you, stay separate from party quests, and require your acceptance.')}</p></div></header>
  <div class="quest-system-banner"><div><span>QUEST COMPLEXITY</span><strong>LEVEL ${ps.quest.complexityLevel}</strong></div><div><span>PERSONAL DIRECTIVES</span><strong>${qs.length}</strong></div></div>${ps.quest.requirementNotes?`<div class="system-rule"><b>SYSTEM REQUIREMENTS</b><p>${esc(ps.quest.requirementNotes)}</p></div>`:''}
  <div class="system-quest-stack">${qs.length?qs.map(q=>{const shown=[...(q.objectives||[]),...(q.hiddenObjectives||[]).filter(o=>o.revealed)];return `<article class="system-quest-card dt19-system-quest ${q.status}"><header><b>${esc(q.name)}</b><span>${esc(q.rank)}</span></header><p>${esc(q.desc||'')}</p>${(q.requirements||[]).length?`<div class="sys-reqs">${q.requirements.map(r=>`<span>◇ ${esc(r)}</span>`).join('')}</div>`:''}${shown.length?`<div class="dt19-sys-objectives">${shown.map(o=>`<span class="${o.done?'done':''}">${o.done?'✓':'○'} ${esc(o.text)}</span>`).join('')}</div>`:''}${(q.failureConditions||[]).length?`<div class="dt19-sys-fail">${q.failureConditions.map(x=>`<span>× ${esc(x)}</span>`).join('')}</div>`:''}${q.timeLimit?`<small>⏱ ${esc(q.timeLimit)}</small>`:''}${(q.rewards?.exp||q.rewards?.gold||(q.rewards?.items||[]).length)?`<div class="dt21-system-reward"><small>SYSTEM REWARD CACHE</small><p>${esc(dt21RewardSummary(q))}</p></div>`:''}<div class="dt19-system-quest-status">${q.status==='offered'?`<button class="maw-btn small" data-accept-system-quest="${esc(q.id)}">ACCEPT DIRECTIVE</button>`:q.status==='completed'&&q.rewardState==='pending'?`<button class="maw-btn small" data-claim-system-quest="${esc(q.id)}">CLAIM SYSTEM REWARD</button>`:`<b>${q.status.toUpperCase()}${q.rewardState==='claimed'?' · REWARD CLAIMED':''}</b>`}</div></article>`;}).join(''):'<div class="sys-muted">No personal System quests are waiting.</div>'}</div></section>`;
  host.querySelectorAll('[data-accept-system-quest]').forEach(b=>b.addEventListener('click',()=>{const q=qs.find(x=>x.id===b.dataset.acceptSystemQuest);if(!q)return;q.accepted=true;q.status='active';dt21Notify(c,'system','DIRECTIVE ACCEPTED',q.name,'The directive is now active.',`system-quest-accepted:${q.id}`);pushState(true);renderPersonalSystem();showToast(`System Quest accepted: ${q.name}`,'buy');}));
  host.querySelectorAll('[data-claim-system-quest]').forEach(b=>b.addEventListener('click',()=>{const q=qs.find(x=>x.id===b.dataset.claimSystemQuest);if(q)dt21ClaimSystemQuestReward(c,q);}));
}
dt19RenderQuestSystemPlayer=dt21RenderQuestSystemPlayer;

// Equipment preview / comparison. This is intentionally informational: equipment
// remains slot-tracked and does not silently rewrite base stats.
function dt21ParseItemStats(it){
  const t=`${it?.stats||''} ${it?.description||it?.desc||it?.notes||''}`;
  const out={};let m;
  if((m=t.match(/\bAC\s*(?:becomes\s*)?(\d+)/i)))out.AC={value:+m[1],mode:'set'};
  if((m=t.match(/([+-]\d+)\s*AC\b/i)))out.AC={value:+m[1],mode:'bonus'};
  if((m=t.match(/([+-]\d+)\s*(?:max\s*)?HP\b/i)))out.HP={value:+m[1],mode:'bonus'};
  if((m=t.match(/([+-]\d+)\s*(?:max\s*)?(?:MP|Mana)\b/i)))out.MP={value:+m[1],mode:'bonus'};
  if((m=t.match(/([+-]\d+)\s*(?:ATK|attack)/i)))out.ATK={value:+m[1],mode:'bonus'};
  if((m=t.match(/([+-]\d+)\s*(?:Spell\s*(?:ATK|Attack|DC)|spell attacks?)/i)))out.SPELL={value:+m[1],mode:'bonus'};
  if((m=t.match(/([+-]\d+)\s*ft\b/i)))out.SPEED={value:+m[1],mode:'bonus'};
  return out;
}
function dt21CompareRows(candidate,current){
  const a=dt21ParseItemStats(candidate),b=dt21ParseItemStats(current);const keys=[...new Set([...Object.keys(a),...Object.keys(b)])];
  if(!keys.length)return `<div class="dt21-compare-empty">No directly comparable numeric stats were found. Review the effects and description before equipping.</div>`;
  return keys.map(k=>{const av=a[k],bv=b[k];const fmt=x=>x?`${x.mode==='bonus'&&x.value>=0?'+':''}${x.value}${x.mode==='set'?' base':''}`:'—';let cls='same';if(av&&bv&&av.mode===bv.mode)cls=av.value>bv.value?'up':av.value<bv.value?'down':'same';else if(av&&!bv)cls='up';return `<div class="dt21-compare-row ${cls}"><span>${k}</span><b>${fmt(bv)}</b><i>→</i><strong>${fmt(av)}</strong></div>`;}).join('');
}
function dt21ShowItem(it,context={}){
  if(!it)return;
  const modal=dt19EnsureItemModal(),body=el('dt19ItemModalBody');const rarity=String(it.rarity||'common').toLowerCase(),slots=dt19CompatibleSlots(it);
  const canEquip=context.character&&context.inventoryIndex!=null&&slots.length;
  body.innerHTML=`<div class="dt19-item-hero rarity-${esc(rarity)}"><div class="dt19-item-icon">${esc(it.icon||'◆')}</div><div><span class="dt19-kicker">${esc((it.shopCategory||it.category||'Item').toUpperCase())}</span><h2>${esc(it.name||'Unnamed Item')}</h2><div class="dt19-item-tags"><span>${esc(rarity.toUpperCase())}</span>${it.tier?`<span>TIER ${Number(it.tier)||1}</span>`:''}</div></div></div>
    ${it.stats?`<div class="dt19-item-statline">${esc(it.stats)}</div>`:''}<p class="dt19-item-description">${esc(it.description||it.desc||it.notes||'No description recorded.')}</p><div class="dt19-item-meta"><span>VALUE <b>◆ ${fmtGold(Number(it.value)||Math.floor((Number(it.price)||0)*.5))}</b></span>${it.qty?`<span>QUANTITY <b>${Number(it.qty)||1}</b></span>`:''}</div>
    ${canEquip?`<section class="dt21-equip-preview"><div class="dt21-preview-head"><div><small>EQUIPMENT PREVIEW</small><b>Compare before replacing gear</b></div><select id="dt19EquipSlot">${slots.map(id=>{const s=DT19_EQUIPMENT_SLOTS.find(x=>x.id===id);return `<option value="${id}">${s?.icon||'◆'} ${s?.label||id}</option>`;}).join('')}</select></div><div id="dt21CompareBody"></div><div class="dt21-equip-note">Equipping changes the slot assignment. Listed bonuses remain item rules; base character stats are never silently overwritten.</div><button class="maw-btn small" id="dt19EquipNow">EQUIP ITEM</button></section>`:''}`;
  modal.classList.remove('hidden');
  const redraw=()=>{if(!canEquip)return;const slot=el('dt19EquipSlot')?.value;const current=dt19EquippedItem(context.character,slot);const h=el('dt21CompareBody');if(h)h.innerHTML=`<div class="dt21-compare-items"><div><small>CURRENT</small><b>${esc(current?.name||'Empty Slot')}</b></div><div><small>NEW</small><b>${esc(it.name||'Item')}</b></div></div><div class="dt21-compare-stats">${dt21CompareRows(it,current)}</div>`;};
  el('dt19EquipSlot')?.addEventListener('change',redraw);redraw();
  el('dt19EquipNow')?.addEventListener('click',()=>{const c=context.character,inv=c?.inventory?.[context.inventoryIndex];if(!c||!inv)return;const slot=el('dt19EquipSlot').value,old=dt19EquippedItem(c,slot);c.equipment[slot]=inv.id;dt21Notify(c,'equipment','EQUIPMENT UPDATED',inv.name,old?`Replaced ${old.name}`:`Equipped to ${DT19_EQUIPMENT_SLOTS.find(x=>x.id===slot)?.label||slot}`,`equip:${Date.now()}:${inv.id}`);pushState(true);modal.classList.add('hidden');renderInventory();showToast(`${inv.name} equipped`,'buy');});
}
dt19ShowItem=dt21ShowItem;

// Make acquisitions and level-ups feel like System events without changing their mechanics.
const _dt21GiveTowerShopItem=giveTowerShopItem;
giveTowerShopItem=function(c,itemOrName,qty=1,source='gm',questName=''){
  const item=typeof itemOrName==='string'?findTowerShopItem(itemOrName):itemOrName;
  const ok=_dt21GiveTowerShopItem(c,itemOrName,qty,source,questName);
  if(ok&&c&&item){const src=source==='shop'?'Tower Exchange':source==='quest'?(questName?`Quest · ${questName}`:'Quest Reward'):source==='party-stash'?'Party Storage':'Game Master';dt21Notify(c,'item','ITEM ACQUIRED',`${item.name}${Math.max(1,Number(qty)||1)>1?` ×${Math.max(1,Number(qty)||1)}`:''}`,src);}
  return ok;
};
const _dt21AnnounceDndLevelUp=announceDndLevelUp;
announceDndLevelUp=function(c,lvl){_dt21AnnounceDndLevelUp(c,lvl);dt21Notify(c,'level','LEVEL INCREASE',`DnD Level ${lvl}`,`System Level ${lvl*10}`,`level:${lvl}`);};
const _dt21AcceptQuest=dt19AcceptQuest;
dt19AcceptQuest=function(id){const c=getChar(),q=(state.cases||[]).find(x=>String(x.id)===String(id));const was=q&&dt19QuestAccepted(c,q);_dt21AcceptQuest(id);if(c&&q&&!was&&dt19QuestAccepted(c,q)){dt21Notify(c,'quest','QUEST ACCEPTED',q.name,q.timeLimit?`Time Limit: ${q.timeLimit}`:'Added to active quest log.',`quest-accepted:${q.id}:${c.id}`);pushState(true);}};

const _dt21Render=render;
render=function(){_dt21Render();dt21EnsureNotificationUi();dt21SyncRemoteNotices();dt21RenderRewardInbox();};
setTimeout(()=>{dt21EnsureNotificationUi();dt21SyncRemoteNotices();dt21RenderRewardInbox();},0);

console.info('[DUNGEON TOWER] BUILD 21 loaded — claimable rewards, equip preview, System notices');

// ============================================================================
// BUILD 22 — SYSTEM COHESION · UI/UX REFINEMENT · STABILITY PASS
// A broad additive pass over the existing game loop. The underlying campaign
// schema and existing mechanics stay compatible; this layer focuses on clearer
// progression, cleaner navigation, safer actions, richer rewards, inventory
// ergonomics, shop comparisons, better System language, and DM diagnostics.
// ============================================================================

const DT22_BUILD = 22;
let _dt22InventoryQuery = localStorage.getItem('dt22-inv-query') || '';
let _dt22InventoryCategory = localStorage.getItem('dt22-inv-cat') || 'all';
let _dt22InventorySort = localStorage.getItem('dt22-inv-sort') || 'name';
let _dt22NoticeFilter = 'all';
let _dt22ErrorCount = 0;

function dt22Safe(label, fn){
  try { return fn(); }
  catch(err){
    console.warn(`[DT22 ${label}]`, err);
    dt22ReportError(label, err);
    return null;
  }
}
function dt22ReportError(label, err){
  _dt22ErrorCount++;
  let badge=el('dt22ErrorBadge');
  if(!badge){
    badge=document.createElement('button');
    badge.id='dt22ErrorBadge';
    badge.type='button';
    badge.className='dt22-error-badge';
    badge.title='A non-fatal interface error occurred. Open the browser console for details.';
    badge.addEventListener('click',()=>showToast('A UI module reported an error. Your campaign data was not erased. Check the browser console for details.','warn'));
    document.body.appendChild(badge);
  }
  badge.textContent=`! ${_dt22ErrorCount}`;
  badge.dataset.label=label;
}
window.addEventListener('error',e=>{ if(e?.error) dt22ReportError('runtime',e.error); });
window.addEventListener('unhandledrejection',e=>{ if(e?.reason) dt22ReportError('promise',e.reason); });

function dt22EnsureState(){
  dt21EnsureState();
  state.schemaVersion=Math.max(Number(state.schemaVersion)||0,22);
  state.characters.forEach(c=>{
    dt21EnsureCharacter(c);
    if(!c.uiFlags || typeof c.uiFlags!=='object' || Array.isArray(c.uiFlags)) c.uiFlags={};
  });
}
dt22EnsureState();
const _dt22Normalize=normalize;
normalize=function(raw){ const m=_dt22Normalize(raw); dt22EnsureState(); return m; };

function dt22CharacterQuests(c){
  const all=(state.cases||[]).filter(q=>dt19QuestVisibleTo(c,q));
  return {
    offered:all.filter(q=>q.status==='available'&&!dt19QuestAccepted(c,q)),
    active:all.filter(q=>q.status==='active'&&dt19QuestAccepted(c,q)),
    completed:all.filter(q=>q.status==='completed'),
    failed:all.filter(q=>q.status==='failed')
  };
}
function dt22PendingRewards(c){
  const id=String(c?.id||'');
  const campaign=(state.cases||[]).filter(q=>q.status==='completed'&&q.rewardClaims?.[id]==='pending');
  const ps=ensurePersonalSystem(c);
  const directives=ps.type==='quest'?(ps.quest.systemQuests||[]).filter(q=>q.status==='completed'&&q.rewardState==='pending'):[];
  return {campaign,directives,total:campaign.length+directives.length};
}
function dt22SystemName(c){
  const ps=ensurePersonalSystem(c), def=PERSONAL_SYSTEM_TYPES[ps.type]||PERSONAL_SYSTEM_TYPES.none;
  return ps.type==='none'?'UNBOUND':String(ps.name||def.name||'SYSTEM').toUpperCase();
}
function dt22NextMilestone(c){
  const vals=Object.entries(c.systemStats||{}).map(([key,value])=>({key,value:Number(value)||0,info:systemMilestoneInfo(key,value)}));
  vals.sort((a,b)=>(a.info.next-a.value)-(b.info.next-b.value));
  return vals[0]||null;
}
function dt22GoTab(tab){
  state.activeTab=tab;
  renderTabs();
  if(tab==='system') renderPersonalSystem();
  if(tab==='cases') renderQuestLog();
  if(tab==='loadout') renderInventory();
  document.querySelector('.tab-bar')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function dt22EnhanceHeader(){
  const c=getChar?.(); if(!c) return;
  const meta=document.querySelector('.topbar-meta');
  if(meta){
    let sys=el('dt22TopSystemLevel');
    if(!sys){
      sys=document.createElement('div'); sys.id='dt22TopSystemLevel'; sys.className='tmeta dt22-top-system';
      meta.appendChild(sys);
    }
    const lvl=Number(c.systemLevel)||1, cur=expIntoCurrentLevel(c), need=expNeededForNextLevel(c), pct=need?Math.min(100,Math.round(cur/need*100)):100;
    sys.innerHTML=`<span>SYS LEVEL</span><strong>LV.${lvl}</strong><i><b style="width:${pct}%"></b></i>`;
  }
  const role=el('topPlayerRole');
  if(role){
    const cls=getClassDef(c.playerClass);
    const sysName=dt22SystemName(c);
    role.textContent=`${cls?.label||'No Class'} · ${sysName}`;
  }
}

function dt22EnsureCommandMetrics(){
  const c=getChar?.(); if(!c) return;
  const deck=document.querySelector('.command-deck'); if(!deck) return;
  let host=el('dt22CommandMetrics');
  if(!host){
    host=document.createElement('div'); host.id='dt22CommandMetrics'; host.className='dt22-command-metrics';
    deck.appendChild(host);
  }
  const q=dt22CharacterQuests(c), rewards=dt22PendingRewards(c), unread=(c.systemNotifications||[]).filter(n=>!n.read).length;
  host.innerHTML=`
    <button type="button" data-dt22-go="cases"><span>ACTIVE QUESTS</span><b>${q.active.length}</b>${q.offered.length?`<small>${q.offered.length} offered</small>`:''}</button>
    <button type="button" data-dt22-go="cases" class="${rewards.total?'attention':''}"><span>REWARD CACHE</span><b>${rewards.total}</b><small>${rewards.total?'claim ready':'empty'}</small></button>
    <button type="button" data-dt22-go="system"><span>BOUND SYSTEM</span><b class="textual">${esc(dt22SystemName(c))}</b><small>open protocol</small></button>
    <button type="button" id="dt22NoticeShortcut" class="${unread?'attention':''}"><span>NOTICES</span><b>${unread}</b><small>${unread?'unread':'clear'}</small></button>`;
  host.querySelectorAll('[data-dt22-go]').forEach(b=>b.addEventListener('click',()=>dt22GoTab(b.dataset.dt22Go)));
  el('dt22NoticeShortcut')?.addEventListener('click',()=>dt21OpenNoticeCenter());
}

function dt22EnhanceStatus(){
  const host=el('statusWindow'), c=getChar?.(); if(!host||!c) return;
  host.querySelector('#dt22StatusBrief')?.remove();
  const anchor=host.querySelector('.sw-alert-row')||host.querySelector('.sw-command-summary'); if(!anchor) return;
  const q=dt22CharacterQuests(c), rewards=dt22PendingRewards(c), lvl=Number(c.systemLevel)||1;
  const cur=expIntoCurrentLevel(c), need=expNeededForNextLevel(c), pct=need?Math.min(100,Math.round(cur/need*100)):100;
  const eq=DT19_EQUIPMENT_SLOTS.filter(s=>dt19EquippedItem(c,s.id)).length;
  const milestone=dt22NextMilestone(c);
  const wrap=document.createElement('section');
  wrap.id='dt22StatusBrief'; wrap.className='dt22-status-brief';
  wrap.innerHTML=`
    <header><div><small>SYSTEM BRIEFING</small><strong>CURRENT PROGRESSION</strong></div><span>${esc(dt22SystemName(c))}</span></header>
    <div class="dt22-brief-grid">
      <button data-dt22-go="status"><span>SYS LEVEL</span><b>${lvl}</b><small>${fmtGold(cur)} / ${fmtGold(need)} EXP</small><i><em style="width:${pct}%"></em></i></button>
      <button data-dt22-go="cases"><span>QUESTS</span><b>${q.active.length}</b><small>${q.offered.length} offered</small></button>
      <button data-dt22-go="cases" class="${rewards.total?'attention':''}"><span>REWARDS</span><b>${rewards.total}</b><small>${rewards.total?'awaiting claim':'none pending'}</small></button>
      <button data-dt22-go="loadout"><span>EQUIPMENT</span><b>${eq}/${DT19_EQUIPMENT_SLOTS.length}</b><small>slots filled</small></button>
      <button data-dt22-go="system"><span>NEXT ASCENSION</span><b class="compact">${milestone?esc(milestone.info.name):'—'}</b><small>${milestone?`${Math.max(0,milestone.info.next-milestone.value)} status away`:'maxed'}</small></button>
    </div>
    <div class="dt22-progression-rule"><b>PROGRESSION:</b><span>EXP raises System Level</span><i>›</i><span>Every 10 System Levels raises DnD Level</span><i>›</i><span>Each System Level grants 3 Status Points</span><i>›</i><span>5 Status in one stat grants +1 DnD ability point</span></div>`;
  anchor.insertAdjacentElement('afterend',wrap);
  wrap.querySelectorAll('[data-dt22-go]').forEach(b=>b.addEventListener('click',()=>dt22GoTab(b.dataset.dt22Go)));
}
const _dt22RenderStatusWindow=renderStatusWindow;
renderStatusWindow=function(){ _dt22RenderStatusWindow(); dt22Safe('status',dt22EnhanceStatus); };

function dt22RewardTokens(q,interactive=true){
  const out=[];
  if(q?.rewards?.exp) out.push(`<span class="dt22-reward-token exp">✦ <b>${fmtGold(q.rewards.exp)}</b> EXP</span>`);
  if(q?.rewards?.gold) out.push(`<span class="dt22-reward-token gold">◆ <b>${fmtGold(q.rewards.gold)}</b> GOLD</span>`);
  (q?.rewards?.items||[]).forEach(raw=>{
    const r=typeof raw==='object'?raw:{name:String(raw),qty:1}; const si=findTowerShopItem(r.name);
    out.push(`${interactive?'<button type="button"':'<span'} class="dt22-reward-token item" ${interactive?`data-dt22-reward-item="${esc(r.name)}"`:''}>${esc(si?.icon||'📦')} <b>${esc(r.name)}</b>${(Number(r.qty)||1)>1?` ×${Number(r.qty)||1}`:''}${interactive?'</button>':'</span>'}`);
  });
  return out.join('')||'<span class="dt22-reward-token empty">No reward data</span>';
}
function dt22ClaimAllQuestRewards(c){
  const pending=(state.cases||[]).filter(q=>q.status==='completed'&&q.rewardClaims?.[String(c.id)]==='pending');
  if(!pending.length) return;
  if(pending.length>1 && !confirm(`Claim rewards from ${pending.length} completed quests?`)) return;
  let claimed=0;
  pending.forEach(q=>{
    const id=String(c.id); if(q.rewardClaims?.[id]!=='pending') return;
    if(q.rewards?.exp) gainExp(c,q.rewards.exp);
    if(q.rewards?.gold) c.points=(Number(c.points)||0)+Number(q.rewards.gold||0);
    (q.rewards?.items||[]).forEach(raw=>{const r=typeof raw==='object'?raw:{name:String(raw),qty:1};if(r.name)giveTowerShopItem(c,r.name,Math.max(1,Number(r.qty)||1),'quest',q.name);});
    q.rewardClaims[id]='claimed';
    const targets=dt19QuestTargets(q); if(targets.length&&targets.every(x=>q.rewardClaims[String(x.id)]==='claimed'))q.rewardsGranted=true;
    claimed++;
  });
  dt21Notify(c,'reward','REWARD CACHE CLAIMED',`${claimed} quest${claimed===1?'':'s'} processed`,'All available campaign quest rewards were delivered.',`claim-all:${Date.now()}`);
  pushState(true); render(); showToast(`${claimed} reward cache${claimed===1?'':'s'} claimed`,'buy');
}
dt21RenderRewardInbox=function(){
  const c=getChar(),tab=document.querySelector('.tab-content[data-tab="cases"]'); if(!c||!tab)return;
  let host=el('dt21RewardInbox');
  if(!host){host=document.createElement('section');host.id='dt21RewardInbox';host.className='dt21-reward-inbox dt22-reward-inbox';const list=el('questList');tab.insertBefore(host,list||tab.firstChild);}
  const pending=(state.cases||[]).filter(q=>q.status==='completed'&&q.rewardClaims?.[String(c.id)]==='pending');
  host.innerHTML=pending.length?`<div class="dt21-inbox-head"><div><small>SYSTEM DELIVERY</small><h3>REWARD CACHE</h3><p>Completed quests wait here until you choose to claim them.</p></div><div class="dt22-inbox-actions"><b>${pending.length}</b>${pending.length>1?'<button type="button" class="maw-btn small" id="dt22ClaimAllRewards">CLAIM ALL</button>':''}</div></div><div class="dt21-reward-grid dt22-reward-grid">${pending.map(q=>`<article><div class="dt22-reward-copy"><small>QUEST COMPLETE</small><strong>${esc(q.name)}</strong><div class="dt22-reward-tokens">${dt22RewardTokens(q,true)}</div></div><button type="button" class="maw-btn small" data-claim-q="${esc(q.id)}">CLAIM</button></article>`).join('')}</div>`:'';
  host.style.display=pending.length?'':'none';
  host.querySelectorAll('[data-claim-q]').forEach(b=>b.addEventListener('click',()=>{const q=(state.cases||[]).find(x=>String(x.id)===String(b.dataset.claimQ));dt21ClaimQuestReward(q,c);}));
  host.querySelectorAll('[data-dt22-reward-item]').forEach(b=>b.addEventListener('click',()=>{const it=findTowerShopItem(b.dataset.dt22RewardItem);if(it)dt19ShowItem({...it,value:Math.floor((Number(it.price)||0)*.5)});}));
  el('dt22ClaimAllRewards')?.addEventListener('click',()=>dt22ClaimAllQuestRewards(c));
};

function dt22EnhanceQuestTab(){
  const c=getChar?.(), tab=document.querySelector('.tab-content[data-tab="cases"]'); if(!c||!tab)return;
  let host=el('dt22QuestSummary');
  if(!host){host=document.createElement('section');host.id='dt22QuestSummary';host.className='dt22-quest-summary';const header=tab.querySelector('.quest-header');header?.insertAdjacentElement('afterend',host);}
  const q=dt22CharacterQuests(c), rewards=dt22PendingRewards(c);
  host.innerHTML=`<button data-dt22-qfilter="active"><span>ACTIVE</span><b>${q.active.length}</b></button><button data-dt22-qfilter="offered"><span>OFFERED</span><b>${q.offered.length}</b></button><button class="${rewards.campaign.length?'attention':''}" data-dt22-qfilter="rewards"><span>REWARD CACHE</span><b>${rewards.campaign.length}</b></button><button data-dt22-qfilter="completed"><span>COMPLETED</span><b>${q.completed.length}</b></button>`;
  host.querySelectorAll('[data-dt22-qfilter]').forEach(b=>b.addEventListener('click',()=>{
    const f=b.dataset.dt22Qfilter;
    if(f==='rewards'){el('dt21RewardInbox')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(f==='completed'){const btn=el('questShowCompleted');if(btn&&el('questCompletedList')?.style.display==='none')btn.click();el('questCompletedList')?.scrollIntoView({behavior:'smooth'});return;}
    el('questList')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  const completedBtn=el('questShowCompleted'); if(completedBtn&&!completedBtn.dataset.dt22Label){completedBtn.dataset.dt22Label='1';completedBtn.textContent=`Show Completed (${q.completed.length+q.failed.length})`;}
}

const _dt22BaseInventory=renderInventory;
renderInventory=function(){ _dt22BaseInventory(); dt22Safe('inventory',dt22EnhanceInventory); };
function dt22EnhanceInventory(){
  const c=getChar?.(), tab=document.querySelector('.tab-content[data-tab="loadout"]'), list=el('inventoryList'); if(!c||!tab||!list)return;
  let tools=el('dt22InventoryTools');
  if(!tools){
    tools=document.createElement('section'); tools.id='dt22InventoryTools'; tools.className='dt22-inventory-tools';
    list.insertAdjacentElement('beforebegin',tools);
  }
  const cats=[...new Set((c.inventory||[]).map(it=>it.category||'Misc'))].sort();
  if(_dt22InventoryCategory!=='all'&&!cats.includes(_dt22InventoryCategory))_dt22InventoryCategory='all';
  const stacks=(c.inventory||[]).reduce((s,it)=>s+(Number(it.qty)||1),0), equippedIds=new Set(Object.values(c.equipment||{}).map(String).filter(Boolean));
  tools.innerHTML=`<div class="dt22-inv-summary"><div><small>INVENTORY</small><b>${(c.inventory||[]).length} UNIQUE · ${stacks} TOTAL</b></div><span>${equippedIds.size} EQUIPPED</span></div><div class="dt22-inv-controls"><label><span>⌕</span><input id="dt22InvSearch" type="search" placeholder="Search items, stats, effects..." value="${esc(_dt22InventoryQuery)}"></label><select id="dt22InvCat"><option value="all">All categories</option>${cats.map(x=>`<option value="${esc(x)}" ${_dt22InventoryCategory===x?'selected':''}>${esc(x)}</option>`).join('')}</select><select id="dt22InvSort"><option value="name" ${_dt22InventorySort==='name'?'selected':''}>Name</option><option value="rarity" ${_dt22InventorySort==='rarity'?'selected':''}>Rarity</option><option value="value" ${_dt22InventorySort==='value'?'selected':''}>Value</option><option value="qty" ${_dt22InventorySort==='qty'?'selected':''}>Quantity</option></select><span id="dt22InvVisible"></span></div>`;
  const rarityOrder={common:0,uncommon:1,rare:2,epic:3,legendary:4};
  const apply=()=>{
    const q=_dt22InventoryQuery.trim().toLowerCase(); let visible=0;
    list.querySelectorAll('.inv-item').forEach(card=>{
      const i=Number(card.dataset.invIndex),it=c.inventory?.[i]; if(!it)return;
      const hay=[it.name,it.category,it.rarity,it.stats,it.description,it.notes].filter(Boolean).join(' ').toLowerCase();
      const show=(!_dt22InventoryQuery||hay.includes(q))&&(_dt22InventoryCategory==='all'||(it.category||'Misc')===_dt22InventoryCategory);
      card.hidden=!show; if(show)visible++;
      const title=card.querySelector('.inv-item-titleline');
      title?.querySelector('.dt22-equipped-badge')?.remove();
      const slot=Object.keys(c.equipment||{}).find(s=>String(c.equipment[s])===String(it.id));
      if(title&&slot){const sd=DT19_EQUIPMENT_SLOTS.find(s=>s.id===slot);const b=document.createElement('span');b.className='dt22-equipped-badge';b.textContent=`${sd?.icon||'⚔'} ${sd?.label||'EQUIPPED'}`;title.appendChild(b);}
    });
    ['.inv-system-grid','.inv-standard-list'].forEach(sel=>{
      const parent=list.querySelector(sel); if(!parent)return;
      [...parent.querySelectorAll('.inv-item')].sort((a,b)=>{
        const ia=c.inventory[+a.dataset.invIndex]||{},ib=c.inventory[+b.dataset.invIndex]||{};
        if(_dt22InventorySort==='value')return (Number(ib.value)||0)-(Number(ia.value)||0);
        if(_dt22InventorySort==='qty')return (Number(ib.qty)||0)-(Number(ia.qty)||0);
        if(_dt22InventorySort==='rarity')return (rarityOrder[String(ib.rarity||'common').toLowerCase()]||0)-(rarityOrder[String(ia.rarity||'common').toLowerCase()]||0)||String(ia.name||'').localeCompare(String(ib.name||''));
        return String(ia.name||'').localeCompare(String(ib.name||''));
      }).forEach(x=>parent.appendChild(x));
    });
    if(el('dt22InvVisible'))el('dt22InvVisible').textContent=`${visible} SHOWN`;
    list.querySelectorAll('section').forEach(sec=>{const shown=[...sec.querySelectorAll('.inv-item')].some(x=>!x.hidden);sec.hidden=!shown;});
  };
  el('dt22InvSearch')?.addEventListener('input',e=>{_dt22InventoryQuery=e.target.value||'';localStorage.setItem('dt22-inv-query',_dt22InventoryQuery);apply();});
  el('dt22InvCat')?.addEventListener('change',e=>{_dt22InventoryCategory=e.target.value||'all';localStorage.setItem('dt22-inv-cat',_dt22InventoryCategory);apply();});
  el('dt22InvSort')?.addEventListener('change',e=>{_dt22InventorySort=e.target.value||'name';localStorage.setItem('dt22-inv-sort',_dt22InventorySort);apply();});
  apply();
}

const _dt22BaseShop=renderShop;
renderShop=function(){ _dt22BaseShop(); dt22Safe('shop',dt22EnhanceShop); };
function dt22EnhanceShop(){
  const c=getChar?.(),host=el('shopList');if(!c||!host)return;
  host.querySelectorAll('.shop-item-card').forEach(card=>{
    const name=card.querySelector('.shop-item-name')?.textContent?.trim(), item=findTowerShopItem(name); if(!item)return;
    const owned=(c.inventory||[]).filter(x=>String(x.name||'').toLowerCase()===String(item.name||'').toLowerCase()).reduce((n,x)=>n+(Number(x.qty)||1),0);
    let badge=card.querySelector('.dt22-shop-owned');
    if(owned&&!badge){badge=document.createElement('span');badge.className='dt22-shop-owned';badge.textContent=`OWNED ×${owned}`;card.querySelector('.shop-item-top')?.appendChild(badge);}
    const details=card.querySelector('.dt19-shop-inspect'); if(details)details.textContent=dt19CompatibleSlots(item).length?'COMPARE':'DETAILS';
  });
}

const _dt22ShowItemBase=dt19ShowItem;
dt19ShowItem=function(it,context={}){
  _dt22ShowItemBase(it,context);
  const c=context.character||getChar?.(), body=el('dt19ItemModalBody'); if(!c||!body||context.inventoryIndex!=null)return;
  const slots=dt19CompatibleSlots(it); if(!slots.length)return;
  const block=document.createElement('section'); block.className='dt22-catalog-compare';
  block.innerHTML=`<div class="dt21-preview-head"><div><small>LOADOUT COMPARISON</small><b>Preview this item against your equipped gear</b></div><select id="dt22CatalogSlot">${slots.map(id=>{const s=DT19_EQUIPMENT_SLOTS.find(x=>x.id===id);return `<option value="${id}">${s?.icon||'◆'} ${s?.label||id}</option>`;}).join('')}</select></div><div id="dt22CatalogCompareBody"></div><p>Preview only. Purchase or obtain the item before it can be equipped.</p>`;
  body.appendChild(block);
  const redraw=()=>{const slot=el('dt22CatalogSlot')?.value,current=dt19EquippedItem(c,slot),h=el('dt22CatalogCompareBody');if(h)h.innerHTML=`<div class="dt21-compare-items"><div><small>CURRENT</small><b>${esc(current?.name||'Empty Slot')}</b></div><div><small>PREVIEW</small><b>${esc(it.name||'Item')}</b></div></div><div class="dt21-compare-stats">${dt21CompareRows(it,current)}</div>`;};
  el('dt22CatalogSlot')?.addEventListener('change',redraw); redraw();
};

function dt22EnhanceEquipment(){
  const c=getChar?.(),host=el('dt19EquipmentPanel'); if(!c||!host)return;
  let summary=host.querySelector('.dt22-loadout-summary');
  if(!summary){summary=document.createElement('div');summary.className='dt22-loadout-summary';host.querySelector('.dt19-section-title')?.insertAdjacentElement('afterend',summary);}
  const filled=DT19_EQUIPMENT_SLOTS.map(s=>({s,it:dt19EquippedItem(c,s.id)})).filter(x=>x.it);
  const rarityCount={};filled.forEach(x=>{const r=String(x.it.rarity||'common').toUpperCase();rarityCount[r]=(rarityCount[r]||0)+1;});
  summary.innerHTML=`<span><b>${filled.length}</b> equipped</span><span><b>${DT19_EQUIPMENT_SLOTS.length-filled.length}</b> empty slots</span><span>${Object.entries(rarityCount).map(([r,n])=>`${n} ${r}`).join(' · ')||'No equipped gear'}</span>`;
}

function dt22SystemArchitecture(){
  const host=el('personalSystemHost'),c=getChar?.(); if(!host||!c)return;
  host.querySelector('#dt22SystemArchitecture')?.remove();
  const ps=ensurePersonalSystem(c),cls=getClassDef(c.playerClass),q=dt22CharacterQuests(c),rewards=dt22PendingRewards(c);
  const known=(c.discoveredSystemArchetypes||[]).map(id=>SYSTEM_ARCHETYPES.find(x=>x.id===id)).filter(Boolean);
  const panel=document.createElement('section'); panel.id='dt22SystemArchitecture'; panel.className='dt22-system-architecture';
  panel.innerHTML=`<header><div><small>SYSTEM ARCHITECTURE</small><h2>HOW YOUR PROGRESSION FITS TOGETHER</h2></div><span>BUILD ${DT22_BUILD}</span></header>
    <div class="dt22-architecture-grid">
      <article><small>1 · CORE PROGRESSION</small><b>SYSTEM LEVEL ${Number(c.systemLevel)||1}</b><p>EXP raises System Level. Every 10 System Levels raises your DnD Level. Each System Level supplies Status Points for permanent growth.</p></article>
      <article><small>2 · CLASS</small><b>${esc(cls?.label||'UNASSIGNED')}</b><p>Your class is your combat package. It unlocks separately from the Personal System and controls class skills and class bonuses.</p></article>
      <article><small>3 · BOUND SYSTEM</small><b>${esc(dt22SystemName(c))}</b><p>The Bound System is your personal rules engine: Chaos collects rolls, Quest issues private directives, and Training converts practice into tracked upgrades.</p></article>
      <article><small>4 · ARCHETYPE KNOWLEDGE</small><b>${known.length} DISCOVERED</b><p>Archetypes are System patterns your character has encountered. They are knowledge and minor unlocks, not a second Bound System.</p></article>
    </div>
    <div class="dt22-system-current"><span>ACTIVE PARTY QUESTS <b>${q.active.length}</b></span><span>PENDING REWARDS <b>${rewards.total}</b></span><span>KNOWN ARCHETYPES <b>${known.length}</b></span><span>CLASS <b>${esc(cls?.label||'NONE')}</b></span></div>
    ${known.length?`<div class="dt22-known-archetypes">${known.slice(0,12).map(a=>`<span title="${esc(a.desc||'')}">${a.icon||'◇'} ${esc(a.baseName||a.name)}</span>`).join('')}${known.length>12?`<span>+${known.length-12} MORE</span>`:''}</div>`:''}`;
  host.prepend(panel);
}
const _dt22RenderPersonalSystem=renderPersonalSystem;
renderPersonalSystem=function(){ _dt22RenderPersonalSystem(); dt22Safe('system architecture',dt22SystemArchitecture); dt22Safe('system rewards',dt22EnhanceSystemQuestRewards); };

function dt22EnhanceSystemQuestRewards(){
  const c=getChar?.(); if(!c)return;
  const ps=ensurePersonalSystem(c); if(ps.type!=='quest')return;
  const pending=(ps.quest.systemQuests||[]).filter(q=>q.status==='completed'&&q.rewardState==='pending');
  const shell=el('personalSystemHost')?.querySelector('.system-shell.type-quest'); if(!shell)return;
  let box=shell.querySelector('.dt22-system-reward-cache');
  if(!box){box=document.createElement('section');box.className='dt22-system-reward-cache';shell.querySelector('.system-hero')?.insertAdjacentElement('afterend',box);}
  box.innerHTML=pending.length?`<div><small>PERSONAL SYSTEM DELIVERY</small><b>${pending.length} REWARD CACHE${pending.length===1?'':'S'} READY</b><p>Claim completed System directives below. They remain separate from campaign quest rewards.</p></div>`:'';
  box.hidden=!pending.length;
}

let _dt22NoticeCenterBound=false;
function dt22RenderNoticeCenter(){
  const c=getChar(),host=el('dt21NoticeList');if(!host)return;
  const types=['all','quest','reward','item','level','equipment','system'];
  const notes=[...(c?.systemNotifications||[])].sort((a,b)=>b.created-a.created).filter(n=>_dt22NoticeFilter==='all'||n.type===_dt22NoticeFilter);
  host.innerHTML=`<div class="dt22-notice-filters">${types.map(t=>`<button type="button" data-dt22-notice-filter="${t}" class="${_dt22NoticeFilter===t?'active':''}">${t.toUpperCase()}</button>`).join('')}</div>${notes.length?notes.map(n=>`<article class="dt21-notice-log type-${esc(n.type)}"><span>${dt21NoticeIcon(n.type)}</span><div><small>${new Date(n.created).toLocaleString()}</small><b>${esc(n.title)}</b>${n.body?`<p>${esc(n.body)}</p>`:''}${n.detail?`<em>${esc(n.detail)}</em>`:''}</div><button type="button" class="dt22-notice-open" data-dt22-notice-open="${esc(n.type)}">OPEN</button></article>`).join(''):'<div class="empty-note">No notices in this category.</div>'}`;
  host.querySelectorAll('[data-dt22-notice-filter]').forEach(b=>b.addEventListener('click',()=>{_dt22NoticeFilter=b.dataset.dt22NoticeFilter;dt22RenderNoticeCenter();}));
  host.querySelectorAll('[data-dt22-notice-open]').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.dt22NoticeOpen;el('dt21NoticeDrawer')?.classList.add('hidden');dt22GoTab(t==='quest'||t==='reward'?'cases':t==='item'||t==='equipment'?'loadout':t==='level'?'status':'system');}));
}
dt21RenderNoticeCenter=dt22RenderNoticeCenter;

function dt22EnhanceParty(){
  const c=getChar?.(),host=el('partyOverview');if(!c||!host)return;
  let summary=el('dt22PartySummary');
  const panel=host.closest('.panel');
  if(!summary&&panel){summary=document.createElement('div');summary.id='dt22PartySummary';summary.className='dt22-party-summary';host.insertAdjacentElement('beforebegin',summary);}
  if(!summary)return;
  const active=(state.characters||[]).filter(x=>x.state==='active'), alive=active.filter(x=>(Number(x.hp?.current)||0)>0), totalHp=active.reduce((s,x)=>s+(Number(x.hp?.current)||0),0),maxHp=active.reduce((s,x)=>s+(Number(x.hp?.max)||0),0),pct=maxHp?Math.round(totalHp/maxHp*100):0;
  summary.innerHTML=`<span><small>ACTIVE</small><b>${active.length}</b></span><span><small>UP</small><b>${alive.length}/${active.length}</b></span><span><small>PARTY HP</small><b>${pct}%</b></span><span><small>STASH</small><b>${(state.partyStash||[]).length}</b></span>`;
}

function dt22BuildDmOverview(){
  if(!dmUnlocked)return;
  const page=el('dmFullPanel')||el('dmContent'); if(!page)return;
  let host=el('dt22DmOverview');
  if(!host){
    host=document.createElement('section');host.id='dt22DmOverview';host.className='dt22-dm-overview';
    const tabs=page.querySelector('.dm-tabs'); tabs?.insertAdjacentElement('afterend',host);
  }
  const active=(state.characters||[]).filter(c=>c.state==='active'), pending=(state.cases||[]).reduce((n,q)=>n+Object.values(q.rewardClaims||{}).filter(x=>x==='pending').length,0);
  host.innerHTML=`<div class="dt22-dm-metrics"><span><small>ACTIVE PARTY</small><b>${active.length}</b></span><span><small>QUESTS</small><b>${(state.cases||[]).filter(q=>q.status==='active').length}</b></span><span class="${pending?'attention':''}"><small>PENDING CLAIMS</small><b>${pending}</b></span><span><small>BESTIARY</small><b>${(state.bestiary||[]).length}</b></span><span><small>NPCS</small><b>${(state.npcs||[]).length}</b></span><span><small>SHOP STOCK</small><b>${(state.shop||[]).length}</b></span></div><div class="dt22-dm-actions"><button type="button" class="maw-btn ghost small" id="dt22DmSaveNow">SAVE NOW</button><button type="button" class="maw-btn ghost small" id="dt22DmExport">EXPORT BACKUP</button><span>Schema v${Number(state.schemaVersion)||22}</span></div>`;
  el('dt22DmSaveNow')?.addEventListener('click',async()=>{try{await pushState(true);showToast('Campaign saved','buy');}catch(e){showToast('Save failed — data remains in memory','warn');}});
  el('dt22DmExport')?.addEventListener('click',dt22ExportBackup);
}
function dt22ExportBackup(){
  const data={...state}; delete data.activeTab; delete data.selectedCharacter;
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');a.href=url;a.download=`DungeonTower-backup-${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);showToast('Campaign backup exported','buy');
}

// Legacy threat-grade award buttons called a removed function in older builds.
// Keep the control safe if it exists: use the selected GM target and award the
// configured amount as Gold, matching the current points/currency model.
function awardMissionPoints(grade){
  const t=THREAT_BY_GRADE[String(grade||'').toUpperCase()]; if(!t)return;
  const idx=Number(el('dmActionTarget')?.value ?? state.selectedCharacter ?? 0),c=state.characters[idx]; if(!c)return;
  c.points=(Number(c.points)||0)+(Number(t.points)||0);
  dt21Notify(c,'reward',`${t.grade}-RANK BOUNTY`,`${fmtGold(t.points)} Gold`,'Awarded by the Game Master.',`bounty:${Date.now()}:${c.id}`);
  pushState(true);render();renderDmPanel();showToast(`+${fmtGold(t.points)} gold to ${c.name||'Player'}`,'buy');
}

function dt22EnhanceDmLabels(){
  const award=el('dmAwardGrades');
  const card=award?.closest('.dm-card');
  const title=card?.querySelector('.dm-card-title'); if(title&&!title.dataset.dt22){title.dataset.dt22='1';title.innerHTML='<span>◆ Threat Bounty</span><small>QUICK GOLD AWARD BY RANK</small>';}
}

function dt22EnhanceSystemUI(){
  dt22EnsureCommandMetrics();
  dt22EnhanceHeader();
  dt22EnhanceQuestTab();
  dt22EnhanceEquipment();
  dt22EnhanceSystemQuestRewards();
  dt22EnhanceParty();
  dt22BuildDmOverview();
  dt22EnhanceDmLabels();
  const foot=document.querySelector('.sidebar-foot');if(foot)foot.textContent=`SYSTEM INTERFACE · BUILD ${DT22_BUILD} · FIREBASE SYNC`;
}

const _dt22Render=render;
render=function(){
  _dt22Render();
  dt22Safe('system ui',dt22EnhanceSystemUI);
};

const _dt22RenderDmPanel=renderDmPanel;
renderDmPanel=function(){ _dt22RenderDmPanel(); dt22Safe('dm overview',()=>{dt22BuildDmOverview();dt22EnhanceDmLabels();}); };

// Escape closes transient interface layers without touching campaign data.
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  el('dt21NoticeDrawer')?.classList.add('hidden');
  el('dt19ItemModal')?.classList.add('hidden');
});

// Improve icon/button accessibility without requiring markup rewrites everywhere.
setTimeout(()=>{
  document.querySelectorAll('button').forEach(b=>{if(!b.getAttribute('aria-label')&&!b.textContent.trim()&&b.title)b.setAttribute('aria-label',b.title);});
  dt22Safe('initial ui',()=>{dt22EnhanceSystemUI();renderStatusWindow();renderInventory();renderShop();renderPersonalSystem();});
},0);

console.info('[DUNGEON TOWER] BUILD 22 loaded — cohesive System UX, richer rewards, inventory tools, shop comparison, DM safety');

// ============================================================================
// BUILD 23 — GAME MASTER COMMAND CENTER
// Full GM-page refinement: dashboard, target dock, live roster telemetry,
// search, filters, session notes, activity log, checkpoints and diagnostics.
// Existing campaign mechanics remain authoritative; this layer coordinates them.
// ============================================================================
const DT23_BUILD = 23;
let _dt23ActiveDmTab = sessionStorage.getItem('dt23-dm-tab') || 'dashboard';
let _dt23QuestSearch = '';
let _dt23QuestStatus = 'all';
let _dt23ShowOnlyClaims = false;
let _dt23ToastGuard = false;

function dt23EnsureState(){
  try{ if(typeof dt22EnsureState==='function') dt22EnsureState(); else if(typeof dt21EnsureState==='function') dt21EnsureState(); }catch(e){}
  state.schemaVersion = Math.max(Number(state.schemaVersion)||0, DT23_BUILD);
  if(!Array.isArray(state.gmActivity)) state.gmActivity=[];
  state.gmActivity = state.gmActivity.filter(Boolean).slice(-140);
  if(typeof state.gmSessionNotes!=='string') state.gmSessionNotes='';
  if(!Number(state.gmSessionStarted)) state.gmSessionStarted=Date.now();
}

function dt23OverlayOpen(){
  const ov=el('dmOverlay');
  return !!(dmUnlocked && ov && !ov.classList.contains('hidden'));
}

function dt23Log(text,type='system',detail=''){
  if(!text) return;
  dt23EnsureState();
  const now=Date.now();
  const msg=String(text).replace(/\s+/g,' ').trim().slice(0,260);
  const last=state.gmActivity[state.gmActivity.length-1];
  if(last && last.text===msg && now-(Number(last.ts)||0)<1200) return;
  state.gmActivity.push({id:`gm-${now}-${Math.random().toString(16).slice(2,6)}`,ts:now,type:String(type||'system'),text:msg,detail:String(detail||'').slice(0,320)});
  if(state.gmActivity.length>140) state.gmActivity.splice(0,state.gmActivity.length-140);
}

function dt23CharacterIndexById(id){
  return (state.characters||[]).findIndex(c=>String(c.id)===String(id));
}
function dt23QuestAssignedTo(q,c){
  if(!q||!c) return false;
  return q.assignedTo==='all' || !q.assignedTo || (Array.isArray(q.assignedTo)&&q.assignedTo.map(String).includes(String(c.id)));
}
function dt23QuestAcceptedBy(q,c){
  if(!q||!c) return false;
  return q.requireAcceptance===false || (q.acceptedBy||[]).map(String).includes(String(c.id));
}
function dt23PendingClaimsFor(c){
  if(!c) return 0;
  return (state.cases||[]).reduce((n,q)=>n+(q.rewardClaims?.[String(c.id)]==='pending'?1:0),0);
}
function dt23ActiveQuestCount(c){
  if(!c) return 0;
  return (state.cases||[]).filter(q=>q.status==='active'&&dt23QuestAssignedTo(q,c)&&dt23QuestAcceptedBy(q,c)).length;
}
function dt23Pct(cur,max){
  max=Math.max(0,Number(max)||0); cur=Math.max(0,Number(cur)||0);
  return max?clamp(Math.round(cur/max*100),0,100):0;
}
function dt23ClassName(c){
  const def=typeof getClassDef==='function'?getClassDef(c?.playerClass):null;
  return def?.label || (c?.playerClass&&c.playerClass!=='none'?c.playerClass:'No Class');
}
function dt23SystemName(c){
  const ps=typeof ensurePersonalSystem==='function'?ensurePersonalSystem(c):c?.personalSystem;
  if(!ps || !ps.type || ps.type==='none') return 'Unbound';
  return ps.name || `${String(ps.type).replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase())} System`;
}

function dt23ActivateDmTab(name,save=true){
  const content=el('dmContent'); if(!content) return;
  let btn=content.querySelector(`.dm-tab[data-dmtab="${name}"]`);
  let panel=content.querySelector(`.dm-tab-content[data-dmtab="${name}"]`);
  if(!btn||!panel){ name='dashboard'; btn=content.querySelector('.dm-tab[data-dmtab="dashboard"]'); panel=content.querySelector('.dm-tab-content[data-dmtab="dashboard"]'); }
  if(!btn||!panel) return;
  content.querySelectorAll('.dm-tab').forEach(b=>b.classList.remove('active'));
  content.querySelectorAll('.dm-tab-content').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active'); panel.classList.add('active');
  _dt23ActiveDmTab=name;
  if(save) sessionStorage.setItem('dt23-dm-tab',name);
  if(name==='dashboard') dt23RenderDashboard();
  if(name==='activity') dt23RenderActivity();
  if(name==='quests') dt23ApplyQuestFilters();
}

function dt23TabCounts(){
  const pending=(state.cases||[]).reduce((n,q)=>n+Object.values(q.rewardClaims||{}).filter(v=>v==='pending').length,0);
  return {
    dashboard:'', roster:(state.characters||[]).length, rewards:pending||'',
    quests:(state.cases||[]).filter(q=>q.status==='active'||q.status==='available').length||'',
    skills:(state.characters||[]).reduce((n,c)=>n+(c.skillStones||[]).length,0)||'',
    classes:(state.customClasses||[]).length||'', titles:(state.titleCatalog||[]).length||'',
    systems:(state.characters||[]).filter(c=>c.personalSystem?.type&&c.personalSystem.type!=='none').length||'',
    bestiary:(state.bestiary||[]).length||'', npcs:(state.npcs||[]).length||'',
    world:(state.sites||[]).length||'', activity:(state.gmActivity||[]).length||''
  };
}
function dt23UpdateTabCounts(){
  const counts=dt23TabCounts();
  el('dmContent')?.querySelectorAll('.dm-tab').forEach(btn=>{
    let badge=btn.querySelector('.dt23-tab-count');
    const val=counts[btn.dataset.dmtab];
    if(val!==''&&val!=null){
      if(!badge){badge=document.createElement('span');badge.className='dt23-tab-count';btn.appendChild(badge);}
      badge.textContent=String(val);
    } else badge?.remove();
  });
}

function dt23SearchIndex(){
  const rows=[];
  (state.characters||[]).forEach((c,i)=>rows.push({kind:'PLAYER',name:c.name||`Player ${i+1}`,sub:`${rankOf(c).id}-Rank · ${dt23ClassName(c)}`,tab:'roster',char:i}));
  (state.cases||[]).forEach(q=>rows.push({kind:'QUEST',name:q.name||'Untitled Quest',sub:`${String(q.status||'available').toUpperCase()} · ${q.rank||'E'}-Rank`,tab:'quests',quest:q.name||''}));
  (state.npcs||[]).forEach(n=>rows.push({kind:'NPC',name:n.name||'Unnamed NPC',sub:`${n.faction||'Independent'} · ${n.location||'Unknown'}`,tab:'npcs'}));
  (state.bestiary||[]).forEach(m=>rows.push({kind:'BESTIARY',name:m.name||'Unnamed Monster',sub:`${m.rank||'E'}-Rank · ${m.type||'Monster'}`,tab:'bestiary'}));
  (state.titleCatalog||[]).forEach(t=>rows.push({kind:'TITLE',name:t.name||'Untitled',sub:String(t.rarity||'common').toUpperCase(),tab:'titles'}));
  (state.customClasses||[]).forEach(c=>rows.push({kind:'CLASS',name:c.label||c.name||'Custom Class',sub:c.primary||'',tab:'classes'}));
  (state.shop||[]).forEach(it=>rows.push({kind:'SHOP',name:it.name||'Item',sub:`${it.category||'Misc'} · ${fmtGold(it.price||0)} Gold`,tab:'world'}));
  return rows;
}
function dt23RenderSearchResults(){
  const input=el('dt23GmSearch'),host=el('dt23GmSearchResults'); if(!input||!host) return;
  const q=input.value.trim().toLowerCase();
  if(q.length<2){host.innerHTML='';host.classList.add('hidden');return;}
  const found=dt23SearchIndex().filter(x=>(`${x.kind} ${x.name} ${x.sub}`).toLowerCase().includes(q)).slice(0,12);
  host.innerHTML=found.length?found.map((x,i)=>`<button type="button" data-dt23-search-result="${i}"><span>${esc(x.kind)}</span><b>${esc(x.name)}</b><small>${esc(x.sub)}</small></button>`).join(''):'<div class="dt23-search-empty">No matching campaign record.</div>';
  host.classList.remove('hidden');
  host.querySelectorAll('[data-dt23-search-result]').forEach(b=>b.addEventListener('click',()=>{
    const x=found[Number(b.dataset.dt23SearchResult)]; if(!x)return;
    if(Number.isInteger(x.char)) state.selectedCharacter=x.char;
    dt23ActivateDmTab(x.tab);
    if(x.quest){const qi=el('dt23QuestSearch');if(qi){qi.value=x.quest;_dt23QuestSearch=x.quest.toLowerCase();dt23ApplyQuestFilters();}}
    input.value='';host.classList.add('hidden');
    renderDmPanel();
  }));
}

function dt23MakeCheckpoint(){
  try{
    const payload={at:Date.now(),data:state};
    sessionStorage.setItem('dt23-gm-checkpoint',JSON.stringify(payload));
    dt23Log('Manual GM checkpoint created','system');
    showToast('GM checkpoint created','buy');
    dt23UpdateCheckpointLabel();
  }catch(e){showToast('Checkpoint could not be stored in this browser','warn');}
}
function dt23RestoreCheckpoint(){
  const raw=sessionStorage.getItem('dt23-gm-checkpoint');
  if(!raw){showToast('No GM checkpoint exists in this browser','warn');return;}
  if(!confirm('Restore the last GM checkpoint?\n\nThis replaces the current campaign state with that checkpoint and saves it to Firebase.')) return;
  try{
    const parsed=JSON.parse(raw); const restored=parsed?.data||parsed;
    state=normalize(restored);
    dt23EnsureState();
    dt23Log('GM checkpoint restored','warning');
    pushState(true); render(); buildDmPanelHtml(); renderDmPanel();
    showToast('Checkpoint restored','buy');
  }catch(e){console.error(e);showToast('Checkpoint restore failed','warn');}
}
function dt23UpdateCheckpointLabel(){
  const elx=el('dt23CheckpointState'); if(!elx)return;
  try{const p=JSON.parse(sessionStorage.getItem('dt23-gm-checkpoint')||'null');elx.textContent=p?.at?`CHECKPOINT ${new Date(p.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`:'NO CHECKPOINT';}catch(e){elx.textContent='NO CHECKPOINT';}
}

function dt23ExportBackupSafe(){
  if(typeof dt22ExportBackup==='function'){dt22ExportBackup();return;}
  const data={...state};delete data.activeTab;delete data.selectedCharacter;
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`DungeonTower-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}

function dt23EnhanceCommandBar(){
  const page=el('dmFullPanel'),tabs=page?.querySelector('.dm-tabs'); if(!page||!tabs)return;
  let bar=el('dt23CommandBar');
  if(!bar){bar=document.createElement('section');bar.id='dt23CommandBar';bar.className='dt23-command-bar';tabs.insertAdjacentElement('beforebegin',bar);}
  const opts=(state.characters||[]).map((c,i)=>`<option value="${i}" ${i===state.selectedCharacter?'selected':''}>${esc(c.name||`Player ${i+1}`)} · ${rankOf(c).id}</option>`).join('');
  bar.innerHTML=`
    <div class="dt23-command-target"><small>GM TARGET</small><select id="dt23GlobalTarget">${opts}</select></div>
    <div class="dt23-command-search"><span>⌕</span><input id="dt23GmSearch" type="search" autocomplete="off" placeholder="Search players, quests, NPCs, monsters, titles, items…"><div id="dt23GmSearchResults" class="dt23-search-results hidden"></div></div>
    <div class="dt23-command-actions">
      <button type="button" class="maw-btn ghost small" id="dt23OpenSheet">SHEET</button>
      <button type="button" class="maw-btn ghost small" id="dt23FocusMode">${sessionStorage.getItem('dt23-gm-focus')==='1'?'EXPAND':'FOCUS'}</button>
      <button type="button" class="maw-btn ghost small" id="dt23SaveNow">SAVE</button>
      <button type="button" class="maw-btn ghost small" id="dt23Checkpoint">CHECKPOINT</button>
      <button type="button" class="maw-btn ghost small" id="dt23Restore">RESTORE</button>
      <button type="button" class="maw-btn ghost small" id="dt23Export">EXPORT</button>
    </div>
    <span class="dt23-checkpoint-state" id="dt23CheckpointState"></span>`;
  page.classList.toggle('dt23-focus-mode',sessionStorage.getItem('dt23-gm-focus')==='1');
  el('dt23GlobalTarget')?.addEventListener('change',e=>{
    state.selectedCharacter=Number(e.target.value)||0;
    ['dmActionTarget','dmExpTarget','dmGoldTarget','dmItemAwardTarget','dmTitleTarget','dmSystemTarget'].forEach(id=>{const x=el(id);if(x&&[...x.options].some(o=>o.value===String(state.selectedCharacter)))x.value=String(state.selectedCharacter);});
    render(); renderDmPanel();
  });
  el('dt23GmSearch')?.addEventListener('input',dt23RenderSearchResults);
  el('dt23GmSearch')?.addEventListener('keydown',e=>{if(e.key==='Escape'){el('dt23GmSearchResults')?.classList.add('hidden');e.target.blur();}});
  el('dt23OpenSheet')?.addEventListener('click',()=>{closeDmOverlay();render();});
  el('dt23FocusMode')?.addEventListener('click',()=>{const on=sessionStorage.getItem('dt23-gm-focus')==='1';sessionStorage.setItem('dt23-gm-focus',on?'0':'1');dt23EnhanceCommandBar();});
  el('dt23SaveNow')?.addEventListener('click',async()=>{await pushState(true);showToast('Campaign saved','buy');});
  el('dt23Checkpoint')?.addEventListener('click',dt23MakeCheckpoint);
  el('dt23Restore')?.addEventListener('click',dt23RestoreCheckpoint);
  el('dt23Export')?.addEventListener('click',()=>{dt23Log('Campaign backup exported','system');dt23ExportBackupSafe();});
  dt23UpdateCheckpointLabel();
}

function dt23DashboardPlayerCard(c,i){
  const rk=rankOf(c),hp=dt23Pct(c.hp?.current,c.hp?.max),mp=dt23Pct(c.mana?.current,c.mana?.max),claims=dt23PendingClaimsFor(c),quests=dt23ActiveQuestCount(c),sys=Math.max(1,Number(c.systemLevel)||1),need=Math.max(1,Number(expForLevel?.(sys))||1),expPct=clamp(Math.round((Number(c.exp)||0)/need*100),0,100);
  return `<article class="dt23-party-card ${c.state==='dead'?'dead':''} ${i===state.selectedCharacter?'selected':''}" data-dt23-char="${i}">
    <header><div class="dt23-party-avatar" style="--rk:${rk.color}">${c.portrait?`<img src="${esc(c.portrait)}" alt="">`:esc(rk.id)}</div><div><small>${esc(rk.tier)} · SYS.LV.${sys}</small><b>${esc(c.name||`Player ${i+1}`)}</b><p>${esc(dt23ClassName(c))} · ${esc(dt23SystemName(c))}</p></div><span class="dt23-state ${esc(c.state||'active')}">${esc((c.state||'active').toUpperCase())}</span></header>
    <div class="dt23-mini-resource"><span>HP</span><i><em style="width:${hp}%"></em></i><b>${Number(c.hp?.current)||0}/${Number(c.hp?.max)||0}</b></div>
    <div class="dt23-mini-resource mp"><span>MP</span><i><em style="width:${mp}%"></em></i><b>${Number(c.mana?.current)||0}/${Number(c.mana?.max)||0}</b></div>
    <div class="dt23-xp-line"><span>EXP</span><i><em style="width:${expPct}%"></em></i><b>${Number(c.exp)||0}/${need}</b></div>
    <div class="dt23-party-facts"><span><small>GOLD</small><b>${fmtGold(c.points||0)}</b></span><span><small>QUESTS</small><b>${quests}</b></span><span class="${claims?'attention':''}"><small>CLAIMS</small><b>${claims}</b></span><span><small>AC</small><b>${Number(c.armor)||10}</b></span></div>
    <footer><button data-dt23-quick="target" data-i="${i}">TARGET</button><button data-dt23-quick="damage" data-i="${i}">−5 HP</button><button data-dt23-quick="heal" data-i="${i}">+5 HP</button><button data-dt23-quick="rest" data-i="${i}">FULL REST</button><button data-dt23-quick="sheet" data-i="${i}">SHEET</button></footer>
  </article>`;
}

function dt23PendingQueueHtml(){
  const rows=[];
  (state.cases||[]).forEach(q=>Object.entries(q.rewardClaims||{}).forEach(([cid,status])=>{if(status==='pending'){const i=dt23CharacterIndexById(cid),c=state.characters[i];rows.push({type:'REWARD',name:q.name||'Quest Reward',who:c?.name||'Unknown Player',tab:'quests'});}}));
  (state.requests||[]).filter(r=>r.status==='pending').forEach(r=>rows.push({type:'REQUEST',name:r.item||r.name||'Item Request',who:r.by||r.playerName||'Player',tab:'world'}));
  (state.cases||[]).filter(q=>q.status==='available'&&q.requireAcceptance!==false).forEach(q=>rows.push({type:'OFFER',name:q.name||'Quest',who:Array.isArray(q.assignedTo)?`${q.assignedTo.length} target(s)`:'Party',tab:'quests'}));
  return rows.length?rows.slice(0,10).map((r,i)=>`<button type="button" class="dt23-queue-row" data-dt23-queue-tab="${r.tab}"><span>${r.type}</span><b>${esc(r.name)}</b><small>${esc(r.who)}</small></button>`).join(''):'<div class="dt23-clear-state">No pending claims, requests, or quest offers.</div>';
}

function dt23Diagnostics(){
  const issues=[]; const ids=new Set();
  (state.characters||[]).forEach((c,i)=>{
    if(!c.id) issues.push({level:'warn',text:`Player ${i+1} has no stable ID.`});
    else if(ids.has(String(c.id)))issues.push({level:'bad',text:`Duplicate character ID on ${c.name||`Player ${i+1}`}.`}); else ids.add(String(c.id));
    if((Number(c.hp?.current)||0)>(Number(c.hp?.max)||0)&&Number(c.hp?.max)>0)issues.push({level:'warn',text:`${c.name||`Player ${i+1}`} HP is above maximum.`});
    if((Number(c.mana?.current)||0)>(Number(c.mana?.max)||0)&&Number(c.mana?.max)>0)issues.push({level:'warn',text:`${c.name||`Player ${i+1}`} MP is above maximum.`});
    Object.entries(c.equipment||{}).forEach(([slot,id])=>{if(id && !(c.inventory||[]).some(it=>String(it.id)===String(id)))issues.push({level:'warn',text:`${c.name||`Player ${i+1}`} has an orphaned ${slot} equipment reference.`});});
  });
  const validIds=new Set((state.characters||[]).map(c=>String(c.id)));
  (state.cases||[]).forEach(q=>{if(Array.isArray(q.assignedTo))q.assignedTo.forEach(id=>{if(!validIds.has(String(id)))issues.push({level:'warn',text:`Quest “${q.name||'Untitled'}” references a missing player.`});});});
  if(!(state.characters||[]).some(c=>c.state==='active'))issues.push({level:'bad',text:'No active players are available.'});
  if(typeof _snapshotQuarantined!=='undefined'&&_snapshotQuarantined)issues.push({level:'bad',text:'Firebase snapshot is quarantined. Saving is currently blocked.'});
  const bytes=JSON.stringify(state).length;
  if(bytes>800000)issues.push({level:'warn',text:`Campaign document is large (${Math.round(bytes/1024)} KB). Firestore limit is approaching.`});
  return {issues,bytes};
}

function dt23RenderDashboard(){
  const host=el('dt23Dashboard'); if(!host)return;
  dt23EnsureState();
  const selected=state.characters[state.selectedCharacter]||state.characters[0],active=(state.characters||[]).filter(c=>c.state==='active');
  const pendingClaims=(state.cases||[]).reduce((n,q)=>n+Object.values(q.rewardClaims||{}).filter(x=>x==='pending').length,0);
  const diag=dt23Diagnostics();
  host.innerHTML=`
    <div class="dt23-dashboard-grid">
      <section class="dm-card dt23-span-8"><div class="dm-card-title"><span>◆ Live Party Command</span><small>${active.length} ACTIVE · CLICK A PLAYER TO TARGET</small></div><div class="dm-card-body"><div class="dt23-party-grid">${(state.characters||[]).map(dt23DashboardPlayerCard).join('')}</div></div></section>
      <section class="dm-card dt23-span-4"><div class="dm-card-title"><span>◈ Campaign Pulse</span><small>LIVE STATE</small></div><div class="dm-card-body"><div class="dt23-pulse-grid">
        <button data-dt23-jump="quests"><small>ACTIVE QUESTS</small><b>${(state.cases||[]).filter(q=>q.status==='active').length}</b></button>
        <button data-dt23-jump="quests" class="${pendingClaims?'attention':''}"><small>PENDING CLAIMS</small><b>${pendingClaims}</b></button>
        <button data-dt23-jump="world"><small>ITEM REQUESTS</small><b>${(state.requests||[]).filter(r=>r.status==='pending').length}</b></button>
        <button data-dt23-jump="bestiary"><small>BESTIARY</small><b>${(state.bestiary||[]).length}</b></button>
        <button data-dt23-jump="npcs"><small>NPCS</small><b>${(state.npcs||[]).length}</b></button>
        <button data-dt23-jump="world"><small>SHOP STOCK</small><b>${(state.shop||[]).length}</b></button>
      </div><div class="dt23-scene-readout"><small>CURRENT SCENE / FLOOR</small><b>${esc(state.sceneName||'No active scene')}</b></div></div></section>

      <section class="dm-card dt23-span-4"><div class="dm-card-title"><span>⚡ Selected Player</span><small>${esc(selected?.name||'NO TARGET')}</small></div><div class="dm-card-body" id="dt23SelectedQuick">${selected?`
        <div class="dt23-selected-identity"><b>${esc(selected.name||'Player')}</b><span>${esc(rankOf(selected).tier)} · SYS.LV.${Number(selected.systemLevel)||1} · ${esc(dt23ClassName(selected))}</span></div>
        <div class="dt23-quick-form"><select id="dt23QuickKind"><option value="hp-heal">Heal HP</option><option value="hp-dmg">Damage HP</option><option value="mp-heal">Restore MP</option><option value="mp-dmg">Drain MP</option><option value="exp">Award EXP</option><option value="gold">Award Gold</option></select><input id="dt23QuickAmount" type="number" min="0" value="10"><button class="maw-btn small" id="dt23QuickApply">APPLY</button></div>
        <div class="dt23-quick-presets"><button data-dt23-qval="5">5</button><button data-dt23-qval="10">10</button><button data-dt23-qval="25">25</button><button data-dt23-qval="50">50</button><button data-dt23-qval="100">100</button><button data-dt23-qval="500">500</button></div>
        <button class="maw-btn ghost small dt23-full-rest" id="dt23SelectedRest">✦ FULL REST</button>`:'<div class="dt23-clear-state">No player selected.</div>'}</div></section>

      <section class="dm-card dt23-span-4"><div class="dm-card-title"><span>📡 Scene & Broadcast</span><small>PLAYER-FACING</small></div><div class="dm-card-body"><label class="dt23-field"><span>Scene / Floor</span><input id="dt23SceneName" value="${esc(state.sceneName||'')}" placeholder="Floor 07 · Frozen Citadel"></label><label class="dt23-field"><span>System Broadcast</span><textarea id="dt23BroadcastText" rows="3" placeholder="System announcement…">${esc(state.broadcast||'')}</textarea></label><div class="dt23-inline-actions"><button class="maw-btn ghost small" id="dt23SetScene">SET SCENE</button><button class="maw-btn small" id="dt23SendBroadcast">SEND BROADCAST</button></div></div></section>

      <section class="dm-card dt23-span-4"><div class="dm-card-title"><span>◇ Player System Message</span><small>PRIVATE NOTICE</small></div><div class="dm-card-body"><div class="dt23-message-grid"><select id="dt23NoticeTarget">${(state.characters||[]).map((c,i)=>`<option value="${i}" ${i===state.selectedCharacter?'selected':''}>${esc(c.name||`Player ${i+1}`)}</option>`).join('')}</select><select id="dt23NoticeType"><option value="system">System</option><option value="quest">Quest</option><option value="reward">Reward</option><option value="item">Item</option><option value="warning">Warning</option></select><input id="dt23NoticeTitle" placeholder="Notice title"><textarea id="dt23NoticeBody" rows="2" placeholder="Message shown to the player"></textarea><button class="maw-btn small" id="dt23NoticeSend">SEND NOTICE</button></div></div></section>

      <section class="dm-card dt23-span-6"><div class="dm-card-title"><span>⌛ Pending Queue</span><small>ACTION REQUIRED</small></div><div class="dm-card-body"><div class="dt23-pending-queue">${dt23PendingQueueHtml()}</div></div></section>
      <section class="dm-card dt23-span-6"><div class="dm-card-title"><span>☷ Recent GM Activity</span><small>LAST ${Math.min(8,(state.gmActivity||[]).length)}</small></div><div class="dm-card-body"><div id="dt23DashboardActivity" class="dt23-dashboard-activity"></div><button type="button" class="maw-btn ghost small" data-dt23-jump="activity">OPEN SESSION LOG</button></div></section>

      <section class="dm-card dt23-span-12"><div class="dm-card-title"><span>⚙ Campaign Health</span><small>${diag.issues.length?'REVIEW RECOMMENDED':'STABLE'}</small></div><div class="dm-card-body"><div class="dt23-health-row"><span class="${diag.issues.length?'warn':'ok'}"><small>DATA HEALTH</small><b>${diag.issues.length?`${diag.issues.length} NOTE${diag.issues.length===1?'':'S'}`:'CLEAR'}</b></span><span><small>STATE SIZE</small><b>${Math.round(diag.bytes/1024)} KB</b></span><span><small>SCHEMA</small><b>v${Number(state.schemaVersion)||DT23_BUILD}</b></span><span><small>SYNC</small><b>${typeof _snapshotQuarantined!=='undefined'&&_snapshotQuarantined?'QUARANTINED':_firstSnapshotReceived?'CONNECTED':'WAITING'}</b></span></div>${diag.issues.length?`<div class="dt23-health-issues">${diag.issues.slice(0,8).map(x=>`<p class="${x.level}">• ${esc(x.text)}</p>`).join('')}</div>`:'<p class="dt23-health-good">No structural campaign problems detected by the GM dashboard.</p>'}</div></section>
    </div>`;

  dt23RenderDashboardActivity();
  host.querySelectorAll('[data-dt23-jump]').forEach(b=>b.addEventListener('click',()=>dt23ActivateDmTab(b.dataset.dt23Jump)));
  host.querySelectorAll('[data-dt23-queue-tab]').forEach(b=>b.addEventListener('click',()=>dt23ActivateDmTab(b.dataset.dt23QueueTab)));
  host.querySelectorAll('[data-dt23-quick]').forEach(b=>b.addEventListener('click',()=>dt23DashboardQuick(Number(b.dataset.i),b.dataset.dt23Quick)));
  host.querySelectorAll('[data-dt23-qval]').forEach(b=>b.addEventListener('click',()=>{const x=el('dt23QuickAmount');if(x)x.value=b.dataset.dt23Qval;}));
  el('dt23QuickApply')?.addEventListener('click',()=>dt23ApplySelectedQuick());
  el('dt23SelectedRest')?.addEventListener('click',()=>dt23DashboardQuick(state.selectedCharacter,'rest'));
  el('dt23SetScene')?.addEventListener('click',()=>{state.sceneName=el('dt23SceneName')?.value||'';pushState(true);showToast(`Scene set: ${state.sceneName||'None'}`,'info');render();renderDmPanel();});
  el('dt23SendBroadcast')?.addEventListener('click',()=>{state.broadcast=el('dt23BroadcastText')?.value||'';pushState(true);showToast('System broadcast sent','info');render();});
  el('dt23NoticeSend')?.addEventListener('click',()=>{
    const c=state.characters[Number(el('dt23NoticeTarget')?.value)];if(!c)return;
    const title=(el('dt23NoticeTitle')?.value||'SYSTEM NOTICE').trim(),body=(el('dt23NoticeBody')?.value||'').trim(),type=el('dt23NoticeType')?.value||'system';
    if(typeof dt21Notify==='function')dt21Notify(c,type,title,body,'Sent by the Game Master.',`gm:${Date.now()}:${c.id}`);
    pushState(true);showToast(`Notice sent to ${c.name||'Player'}`,'buy');
    if(el('dt23NoticeTitle'))el('dt23NoticeTitle').value='';if(el('dt23NoticeBody'))el('dt23NoticeBody').value='';
  });
}

function dt23RenderDashboardActivity(){
  const host=el('dt23DashboardActivity');if(!host)return;
  const rows=[...(state.gmActivity||[])].slice(-8).reverse();
  host.innerHTML=rows.length?rows.map(x=>`<div class="dt23-activity-row type-${esc(x.type)}"><time>${new Date(x.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time><span>${esc(x.text)}</span></div>`).join(''):'<div class="dt23-clear-state">GM actions will appear here during the session.</div>';
}

function dt23DashboardQuick(i,action){
  const c=state.characters[i];if(!c)return;
  state.selectedCharacter=i;
  if(action==='target'){render();renderDmPanel();return;}
  if(action==='sheet'){closeDmOverlay();render();return;}
  if(action==='damage')c.hp.current=Math.max(0,(Number(c.hp?.current)||0)-5);
  if(action==='heal')c.hp.current=Math.min(Number(c.hp?.max)||0,(Number(c.hp?.current)||0)+5);
  if(action==='rest'){c.hp.current=Number(c.hp?.max)||0;c.mana.current=Number(c.mana?.max)||0;c.tempHp=0;c.fatigue=0;c.deathSaves={successes:0,failures:0,stable:false};}
  try{ensureClamp(c);}catch(e){}
  pushState(true);showToast(`${c.name||'Player'} ${action==='damage'?'took 5 HP damage':action==='heal'?'recovered 5 HP':'completed a full rest'}`,action==='damage'?'warn':'buy');render();renderDmPanel();
}
function dt23ApplySelectedQuick(){
  const c=state.characters[state.selectedCharacter];if(!c)return;
  const kind=el('dt23QuickKind')?.value||'hp-heal',amt=Math.max(0,Number(el('dt23QuickAmount')?.value)||0);if(!amt)return;
  if(kind==='hp-heal')c.hp.current=Math.min(Number(c.hp?.max)||0,(Number(c.hp?.current)||0)+amt);
  if(kind==='hp-dmg')c.hp.current=Math.max(0,(Number(c.hp?.current)||0)-amt);
  if(kind==='mp-heal')c.mana.current=Math.min(Number(c.mana?.max)||0,(Number(c.mana?.current)||0)+amt);
  if(kind==='mp-dmg')c.mana.current=Math.max(0,(Number(c.mana?.current)||0)-amt);
  if(kind==='exp')gainExp(c,amt);
  if(kind==='gold')c.points=(Number(c.points)||0)+amt;
  try{ensureClamp(c);}catch(e){}
  pushState(true);showToast(`${c.name||'Player'} · ${kind.replace('-', ' ')} ${amt}`,(kind.includes('dmg'))?'warn':'buy');render();renderDmPanel();
}

function dt23RenderActivity(){
  const host=el('dt23Activity'); if(!host)return;dt23EnsureState();
  const elapsed=Math.max(0,Date.now()-Number(state.gmSessionStarted||Date.now())),mins=Math.floor(elapsed/60000),h=Math.floor(mins/60),m=mins%60;
  const rows=[...(state.gmActivity||[])].reverse();
  host.innerHTML=`<div class="dt23-activity-layout">
    <section class="dm-card"><div class="dm-card-title"><span>📝 Session Workspace</span><small>${h}H ${m}M CURRENT SESSION</small></div><div class="dm-card-body"><label class="dt23-field"><span>Private GM Session Notes</span><textarea id="dt23SessionNotes" rows="12" placeholder="Private session notes, reminders, encounter prep…">${esc(state.gmSessionNotes||'')}</textarea></label><div class="dt23-inline-actions"><button class="maw-btn small" id="dt23SaveNotes">SAVE NOTES</button><button class="maw-btn ghost small" id="dt23NewSession">START NEW SESSION MARKER</button></div><div class="dt23-manual-log"><input id="dt23ManualLog" placeholder="Add a manual timeline entry…"><button class="maw-btn ghost small" id="dt23AddManualLog">ADD LOG</button></div></div></section>
    <section class="dm-card"><div class="dm-card-title"><span>☷ GM Activity Timeline</span><small>${rows.length} ENTRIES</small></div><div class="dm-card-body"><div class="dt23-activity-toolbar"><button class="maw-btn ghost small" id="dt23ClearActivity">CLEAR LOG</button><button class="maw-btn ghost small" id="dt23ExportActivity">EXPORT LOG</button></div><div class="dt23-activity-list">${rows.length?rows.map(x=>`<article class="type-${esc(x.type)}"><time>${new Date(x.ts).toLocaleString()}</time><b>${esc(x.text)}</b>${x.detail?`<p>${esc(x.detail)}</p>`:''}</article>`).join(''):'<div class="dt23-clear-state">No GM activity recorded yet.</div>'}</div></div></section>
  </div>`;
  el('dt23SaveNotes')?.addEventListener('click',()=>{state.gmSessionNotes=el('dt23SessionNotes')?.value||'';pushState(true);showToast('GM session notes saved','buy');});
  el('dt23NewSession')?.addEventListener('click',()=>{state.gmSessionStarted=Date.now();dt23Log('New session marker started','system');pushState(true);dt23RenderActivity();showToast('New session marker started','info');});
  el('dt23AddManualLog')?.addEventListener('click',()=>{const t=el('dt23ManualLog')?.value?.trim();if(!t)return;dt23Log(t,'manual');pushState(true);dt23RenderActivity();});
  el('dt23ClearActivity')?.addEventListener('click',()=>{if(!confirm('Clear the GM activity timeline? Session notes and campaign data are not affected.'))return;state.gmActivity=[];pushState(true);dt23RenderActivity();});
  el('dt23ExportActivity')?.addEventListener('click',()=>{const body=(state.gmActivity||[]).map(x=>`${new Date(x.ts).toLocaleString()} [${String(x.type).toUpperCase()}] ${x.text}${x.detail?' — '+x.detail:''}`).join('\n');const blob=new Blob([body||'No activity recorded.'],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`DungeonTower-GM-log-${new Date().toISOString().slice(0,10)}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}

function dt23EnhanceRoster(){
  const roster=el('dmRoster');if(!roster)return;
  roster.querySelectorAll('.dm-agent').forEach(agent=>{
    const pick=agent.querySelector('.dm-agent-pick'),i=Number(pick?.dataset.i);if(!Number.isInteger(i))return;const c=state.characters[i];if(!c)return;
    agent.classList.toggle('dt23-targeted',i===state.selectedCharacter);
    let live=agent.querySelector('.dt23-agent-live');if(!live){live=document.createElement('div');live.className='dt23-agent-live';agent.querySelector('.dm-agent-controls')?.insertAdjacentElement('beforebegin',live);}
    const hp=dt23Pct(c.hp?.current,c.hp?.max),mp=dt23Pct(c.mana?.current,c.mana?.max),claims=dt23PendingClaimsFor(c),quests=dt23ActiveQuestCount(c),sys=Math.max(1,Number(c.systemLevel)||1),need=Math.max(1,Number(expForLevel?.(sys))||1),xp=clamp(Math.round((Number(c.exp)||0)/need*100),0,100);
    live.innerHTML=`<div class="dt23-agent-bars"><div><span>HP <b>${Number(c.hp?.current)||0}/${Number(c.hp?.max)||0}</b></span><i><em class="hp" style="width:${hp}%"></em></i></div><div><span>MP <b>${Number(c.mana?.current)||0}/${Number(c.mana?.max)||0}</b></span><i><em class="mp" style="width:${mp}%"></em></i></div><div><span>SYS.LV.${sys} <b>${Number(c.exp)||0}/${need} EXP</b></span><i><em class="xp" style="width:${xp}%"></em></i></div></div><div class="dt23-agent-facts"><span>${esc(dt23ClassName(c))}</span><span>${esc(dt23SystemName(c))}</span><span>${quests} quest${quests===1?'':'s'}</span>${claims?`<span class="attention">${claims} reward claim${claims===1?'':'s'}</span>`:''}</div><div class="dt23-agent-quick"><button data-dt23-rquick="damage" data-i="${i}">−5 HP</button><button data-dt23-rquick="heal" data-i="${i}">+5 HP</button><button data-dt23-rquick="rest" data-i="${i}">REST</button><button data-dt23-rquick="sheet" data-i="${i}">SHEET</button></div>`;
  });
  roster.querySelectorAll('[data-dt23-rquick]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();dt23DashboardQuick(Number(b.dataset.i),b.dataset.dt23Rquick);}));
}

function dt23EnsureQuestToolbar(){
  const list=el('dmQuestList'),body=list?.closest('.dm-card-body');if(!list||!body)return;
  let tools=el('dt23QuestTools');if(!tools){tools=document.createElement('div');tools.id='dt23QuestTools';tools.className='dt23-quest-tools';body.insertBefore(tools,list);}
  if(!tools.dataset.bound){
    tools.dataset.bound='1';
    tools.innerHTML=`<label><span>⌕</span><input id="dt23QuestSearch" type="search" placeholder="Search quest board…"></label><select id="dt23QuestStatus"><option value="all">All statuses</option><option value="available">Available</option><option value="active">Active</option><option value="completed">Completed</option><option value="failed">Failed</option></select><label class="dt23-claim-toggle"><input id="dt23QuestClaims" type="checkbox"> Pending rewards only</label><b id="dt23QuestVisibleCount"></b>`;
    el('dt23QuestSearch')?.addEventListener('input',e=>{_dt23QuestSearch=e.target.value.trim().toLowerCase();dt23ApplyQuestFilters();});
    el('dt23QuestStatus')?.addEventListener('change',e=>{_dt23QuestStatus=e.target.value;dt23ApplyQuestFilters();});
    el('dt23QuestClaims')?.addEventListener('change',e=>{_dt23ShowOnlyClaims=e.target.checked;dt23ApplyQuestFilters();});
  }
  if(el('dt23QuestSearch'))el('dt23QuestSearch').value=_dt23QuestSearch;
  if(el('dt23QuestStatus'))el('dt23QuestStatus').value=_dt23QuestStatus;
  if(el('dt23QuestClaims'))el('dt23QuestClaims').checked=_dt23ShowOnlyClaims;
}
function dt23ApplyQuestFilters(){
  dt23EnsureQuestToolbar();
  const host=el('dmQuestList');if(!host)return;let shown=0;
  host.querySelectorAll('.dm-quest-row').forEach(row=>{
    const sel=row.querySelector('.dm-quest-status'),qi=Number(sel?.dataset.qi),q=state.cases?.[qi];
    const text=row.textContent.toLowerCase(),status=sel?.value||q?.status||'';
    const hasClaim=q?Object.values(q.rewardClaims||{}).some(v=>v==='pending'):false;
    const ok=(!_dt23QuestSearch||text.includes(_dt23QuestSearch))&&(_dt23QuestStatus==='all'||status===_dt23QuestStatus)&&(!_dt23ShowOnlyClaims||hasClaim);
    row.style.display=ok?'':'none';if(ok)shown++;
  });
  const ct=el('dt23QuestVisibleCount');if(ct)ct.textContent=`${shown}/${(state.cases||[]).length}`;
}

function dt23EnsureListFilter(hostId,label){
  const host=el(hostId),body=host?.closest('.dm-card-body');if(!host||!body)return;
  const id=`dt23Filter-${hostId}`;let inp=el(id);if(!inp){const wrap=document.createElement('label');wrap.className='dt23-list-filter';wrap.innerHTML=`<span>⌕</span><input id="${id}" type="search" placeholder="Search ${esc(label)}…">`;body.insertBefore(wrap,host);inp=el(id);inp?.addEventListener('input',()=>dt23ApplyListFilter(hostId,id));}
  dt23ApplyListFilter(hostId,id);
}
function dt23ApplyListFilter(hostId,inputId){
  const host=el(hostId),inp=el(inputId);if(!host||!inp)return;const q=inp.value.trim().toLowerCase();
  [...host.children].forEach(ch=>{ch.style.display=!q||ch.textContent.toLowerCase().includes(q)?'':'none';});
}

function dt23EnhanceContextPanels(){
  dt23EnhanceRoster();dt23EnsureQuestToolbar();dt23ApplyQuestFilters();
  dt23EnsureListFilter('dt19BestiaryList','bestiary');
  dt23EnsureListFilter('dt19NpcList','NPCs');
  dt23EnsureListFilter('dmTitleCatalog','titles');
  dt23EnsureListFilter('dmCCList','classes');
  dt23UpdateTabCounts();
  const old=el('dt22DmOverview');if(old)old.classList.add('dt23-superseded');
}

function dt23EnhanceDmPage(){
  if(!dmUnlocked)return;dt23EnsureState();
  const content=el('dmContent'),page=el('dmFullPanel'),tabs=page?.querySelector('.dm-tabs');if(!content||!page||!tabs)return;
  if(!tabs.querySelector('[data-dmtab="dashboard"]'))tabs.insertAdjacentHTML('afterbegin','<button class="dm-tab" data-dmtab="dashboard">◆ Command</button>');
  if(!tabs.querySelector('[data-dmtab="activity"]'))tabs.insertAdjacentHTML('beforeend','<button class="dm-tab" data-dmtab="activity">☷ Session</button>');
  if(!content.querySelector('.dm-tab-content[data-dmtab="dashboard"]')){const first=content.querySelector('.dm-tab-content');first?.insertAdjacentHTML('beforebegin','<div class="dm-tab-content dt23-dashboard-tab" data-dmtab="dashboard"><div id="dt23Dashboard"></div></div>');}
  if(!content.querySelector('.dm-tab-content[data-dmtab="activity"]')){const world=content.querySelector('.dm-tab-content[data-dmtab="world"]');(world||content.lastElementChild)?.insertAdjacentHTML(world?'beforebegin':'afterend','<div class="dm-tab-content dt23-activity-tab" data-dmtab="activity"><div id="dt23Activity"></div></div>');}
  tabs.querySelectorAll('.dm-tab').forEach(btn=>{if(btn.dataset.dt23Bound)return;btn.dataset.dt23Bound='1';btn.addEventListener('click',()=>{_dt23ActiveDmTab=btn.dataset.dmtab;sessionStorage.setItem('dt23-dm-tab',_dt23ActiveDmTab);setTimeout(()=>{if(_dt23ActiveDmTab==='dashboard')dt23RenderDashboard();if(_dt23ActiveDmTab==='activity')dt23RenderActivity();if(_dt23ActiveDmTab==='quests')dt23ApplyQuestFilters();},0);});});
  dt23EnhanceCommandBar();
  dt23EnhanceContextPanels();
  dt23ActivateDmTab(_dt23ActiveDmTab,false);
  dt23RenderDashboard();
  if(_dt23ActiveDmTab==='activity')dt23RenderActivity();
}

// Preserve quest filters after the existing quest renderer rebuilds its rows.
const _dt23RenderDmQuestList=renderDmQuestList;
renderDmQuestList=function(){_dt23RenderDmQuestList();try{dt23EnsureQuestToolbar();dt23ApplyQuestFilters();dt23UpdateTabCounts();}catch(e){console.warn('[DT23 quest tools]',e);}};

// Keep the command center present through every existing DM rebuild path.
const _dt23BuildDmPanelHtml=buildDmPanelHtml;
buildDmPanelHtml=function(){_dt23BuildDmPanelHtml();try{dt23EnhanceDmPage();}catch(e){console.error('[DT23 GM build]',e);}};
const _dt23RenderDmPanel=renderDmPanel;
renderDmPanel=function(){_dt23RenderDmPanel();try{dt23EnhanceDmPage();}catch(e){console.error('[DT23 GM render]',e);}};

// Record successful/failed GM feedback without changing any existing action logic.
const _dt23ShowToast=showToast;
showToast=function(msg,kind='info',dur=3200){
  const result=_dt23ShowToast(msg,kind,dur);
  try{
    if(!_dt23ToastGuard && dt23OverlayOpen()){
      _dt23ToastGuard=true;dt23Log(msg,kind);dt23RenderDashboardActivity();if(_dt23ActiveDmTab==='activity')dt23RenderActivity();_dt23ToastGuard=false;
    }
  }catch(e){_dt23ToastGuard=false;}
  return result;
};

// Ctrl/Cmd+K focuses GM search; Alt+G returns to the command dashboard.
document.addEventListener('keydown',e=>{
  if(!dt23OverlayOpen())return;
  if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();el('dt23GmSearch')?.focus();}
  if(e.altKey&&String(e.key).toLowerCase()==='g'){e.preventDefault();dt23ActivateDmTab('dashboard');}
});

setTimeout(()=>{try{if(dt23OverlayOpen())dt23EnhanceDmPage();}catch(e){console.warn('[DT23 initial GM enhancement]',e);}},0);
console.info('[DUNGEON TOWER] BUILD 23 loaded — Game Master Command Center overhaul');
