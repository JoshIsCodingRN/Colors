// UI Elements
const setupView = document.getElementById("setup-view");
const tournamentView = document.getElementById("tournament-view");
const resultView = document.getElementById("result-view");

const colorCountInput = document.getElementById("color-count");
const matchCountInput = document.getElementById("match-count");
const colorCountVal = document.getElementById("color-count-val");
const matchCountVal = document.getElementById("match-count-val");
const startBtn = document.getElementById("start-btn");
const errorMsg = document.getElementById("error-msg");

const colorLeft = document.getElementById("color-left");
const colorRight = document.getElementById("color-right");
const swatchLeft = document.getElementById("swatch-left");
const swatchRight = document.getElementById("swatch-right");
const nameLeft = document.getElementById("name-left");
const nameRight = document.getElementById("name-right");
const hexLeft = document.getElementById("hex-left");
const hexRight = document.getElementById("hex-right");

const currentMatchSpan = document.getElementById("current-match");
const totalMatchesSpan = document.getElementById("total-matches");
const progressBarFill = document.getElementById("progress-bar-fill");
const roundDisplay = document.getElementById("round-display");
const instructionText = document.querySelector(".instruction");

const leaderboard = document.getElementById("leaderboard");
const paletteWarm = document.getElementById("palette-warm");
const paletteCool = document.getElementById("palette-cool");
const restartBtn = document.getElementById("restart-btn");

// State
let allColors = [];
let targetMatches = 0;
let currentMatchRound = 0;
let currentLeft = null;
let currentRight = null;

function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const smallViewport = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    return mobileUserAgent || (coarsePointer && smallViewport);
}

function applyDeviceMode() {
    const mobile = isMobileDevice();
    document.body.classList.toggle("is-mobile", mobile);
    if (instructionText) {
        instructionText.innerText = mobile ? "Tap the color you prefer." : "Click the color you prefer.";
    }
}

// HSL to HEX Utility
// h = [0,360], s = [0,100], l = [0,100]
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Name a color based on its HSL values with a fun editorial tone
function getColorName(h, s, l, hex) {
    // Check for exact brand/location matches first using a distance threshold
    const exactMatches = [
        { hex: "#FFC72C", name: "McDonald's Yellow" },
        { hex: "#DA291C", name: "McDonald's Red" },
        { hex: "#00704A", name: "Starbucks Green" },
        { hex: "#1DB954", name: "Spotify Green" },
        { hex: "#1877F2", name: "Facebook Blue" },
        { hex: "#5865F2", name: "Discord Purple" },
        { hex: "#9146FF", name: "Twitch Purple" },
        { hex: "#E50914", name: "Netflix Red" },
        { hex: "#0ABAB5", name: "Tiffany Blue" },
        { hex: "#FF6600", name: "UPS Orange" }
    ];

    // Helper to calc color rgb distance
    const getRgb = (hx) => [parseInt(hx.slice(1,3),16), parseInt(hx.slice(3,5),16), parseInt(hx.slice(5,7),16)];
    const genRgb = getRgb(hex);

    for (let match of exactMatches) {
        const mRgb = getRgb(match.hex);
        const dist = Math.sqrt(
            Math.pow(genRgb[0] - mRgb[0], 2) + 
            Math.pow(genRgb[1] - mRgb[1], 2) + 
            Math.pow(genRgb[2] - mRgb[2], 2)
        );
        if (dist < 18) { // If very close visually
            const verbs = ["Sweating", "Dissociating", "Malfunctioning", "Gaslighting", "Tax-Evading", "Union-Busting", "Overcompensating", "Fermenting", "Hallucinating", "Vibrating", "Panicking", "Scheming"];
            const vHash = Math.floor(h + s + l) % verbs.length;
            return `${verbs[vHash]} ${match.name}`;
        }
    }

    let adjectives = [];
    if (l < 25) {
        adjectives = ["Abyssal", "Cursed", "Midnight", "Void", "Ominous", "Bottomless", "Threatening", "Haunted", "Dismal", "Sinister", "Shadowy"];
    } else if (l > 80) {
        adjectives = ["Blinding", "Angelic", "Radioactive", "Ghostly", "Neon", "Ethereal", "Piercing", "Heavenly", "Overexposed", "Washed", "Gleaming"];
    } else if (s > 80) {
        adjectives = ["Screaming", "Obnoxious", "Spicy", "Aggressive", "Feral", "Hostile", "Unapologetic", "Loud", "Chaotic", "Intense", "Manic"];
    } else if (s < 30) {
        adjectives = ["Depressed", "Apathetic", "Washed-out", "Dusty", "Sad", "Lethargic", "Gritty", "Tired", "Boring", "Uninspired", "Lifeless"];
    } else {
        adjectives = ["Standard", "Corporate", "Average", "Sensible", "Casual", "Mundane", "Vanilla", "Generic", "Obligatory", "Default", "Lukewarm", "Docile", "Tame", "Acceptable"];
    }

    let nouns = [];
    const isDark = l < 35;
    const isMuted = s < 35;

    if (s < 12 || l < 10 || l > 92) {
        if (l < 20) nouns = ["Mariana Trench", "Black Hole", "Volcanic Ash", "Obsidian", "Basalt", "Vantablack"];
        else if (l > 85) nouns = ["Salt Flat", "Surrender Flag", "Snowblindness", "Limestone", "Surgically Clean"];
        else nouns = ["Concrete", "Wet Asphalt", "River Stone", "Rainy Tuesday", "Static", "Pewter"];
    } else if (h < 15 || h >= 345) { // Red
        if (isDark) nouns = ["Mars Dirt", "Dried Blood", "Canyon Wall", "Fruit Punch", "Rust"];
        else if (isMuted) nouns = ["Red Rock", "Faded Barn", "Sunburn", "Eraser Smudge"];
        else nouns = ["Lava Flow", "Stop Sign", "Hot Sauce", "Tomato Soup", "Fire Engine"];
    } else if (h < 45) { // Orange / Brown
        if (isDark || isMuted) nouns = ["Sahara Desert", "Grand Canyon", "Mud", "Coffee Ground", "Sandstone"];
        else nouns = ["Traffic Cone", "Cheese Dust", "Spray Tan", "Cheetos Warning", "Safety Vest"];
    } else if (h < 65) { // Yellow
        if (isDark || isMuted) nouns = ["Sulfur Springs", "Tarnished Brass", "Dehydrated Urine", "Savanna Sand"];
        else nouns = ["Electric Lemon", "Caution Tape", "Rubber Duck", "Taxicab", "Mustard"];
    } else if (h < 85) { // Lime / Yellow-Green
        if (isDark || isMuted) nouns = ["Marshland", "Mushy Pea", "Split Pea Soup", "Pond Scum", "Mossy Granite"];
        else nouns = ["Mountain Dew", "Tennis Ball", "Radioactive Waste", "Uranium", "Glowstick"];
    } else if (h < 150) { // Green
        if (isDark) nouns = ["Amazon Rainforest", "Pine Needle", "Mold", "Kelp Forest"];
        else if (isMuted) nouns = ["Camouflage", "Stale Matcha", "Zombie Skin", "Tundra Grass"];
        else nouns = ["Alien Vomit", "Toad Skin", "Astroturf", "Algae", "Lawnmower"];
    } else if (h < 200) { // Cyan/Teal
        if (isDark) nouns = ["Deep Sea", "Abyss", "Seaweed", "Ocean Trench"];
        else if (isMuted) nouns = ["Oxidized Copper", "Glacier Water", "Tarnished Coin"];
        else nouns = ["Dentist Scrub", "Pool Water", "Baja Blast", "Mouthwash", "Coral Reef"];
    } else if (h < 250) { // Blue
        if (isDark) nouns = ["Midnight Sky", "Ink", "Navy Denim", "Atlantic Ocean"];
        else if (isMuted) nouns = ["Cloudy Sky", "Washed Denim", "Sad Tuesday", "Faded Pen"];
        else nouns = ["Blue Screen of Death", "Corporate Logo", "Hyperlink", "Crater Lake"];
    } else if (h < 290) { // Purple
        if (isDark || isMuted) nouns = ["Dead Rose", "Bruise", "Poison", "Grape Medicine"];
        else nouns = ["Grimace", "Forbidden Grape", "Thanos", "Amethyst Geode", "Waluigi"];
    } else if (h < 345) { // Pink/Magenta
        if (isDark || isMuted) nouns = ["Flesh", "Cheap Ham", "Faded Flamingo", "Rose Quartz"];
        else nouns = ["Millennial Angst", "Pepto Bismol", "Cyberpunk Mistake", "Plastic Flamingo", "Bubblegum"];
    }

    // Deterministic random choice based on exact H, S, L values
    const adjHash = Math.floor(h + s) % adjectives.length;
    const nounHash = Math.floor(h + l + s) % nouns.length;

    return `${adjectives[adjHash]} ${nouns[nounHash]}`;
}

// Generate an array of distinct colors utilizing the golden angle
function generateSpectrum(count) {
    const arr = [];
    const seen = new Set();
    let i = 0;
    let attempts = 0;
    
    while (arr.length < count && attempts < 5000) {
        attempts++;
        // Golden angle approximation + random jitter to prevent repeating values endlessly
        const h = ((i * 137.5) + (Math.random() * 5)) % 360;
        // Jitter saturation and lightness
        const rawS = 50 + (i % 3) * 20 + (Math.random() * 10 - 5);
        const rawL = 30 + (i % 4) * 15 + (Math.random() * 10 - 5);
        
        // Clamp values to valid HSL percentages
        const s = Math.max(0, Math.min(100, rawS));
        const l = Math.max(0, Math.min(100, rawL));
        
        const hexVal = hslToHex(h, s, l);
        
        // Ensure strictly unique colors get added
        if (!seen.has(hexVal)) {
            seen.add(hexVal);
            arr.push({ 
                id: i,
                hex: hexVal, 
                h, 
                s, 
                l,
                name: getColorName(h, s, l, hexVal),
                elo: 1200,
                matches: 0
            });
        }
        i++;
    }
    return arr;
}

// Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize tournament
function initTournament() {
    const numColors = parseInt(colorCountInput.value);
    const matchesCount = parseInt(matchCountInput.value);
    if (isNaN(numColors) || numColors < 4 || numColors > 256 || isNaN(matchesCount) || matchesCount < 1) {
        errorMsg.classList.remove("hidden");
        return;
    }
    errorMsg.classList.add("hidden");

    allColors = generateSpectrum(numColors);
    
    targetMatches = matchesCount;
    currentMatchRound = 0;

    showView(tournamentView);
    updateProgress();
    loadNextMatch();
}

function calculateEloChange(winnerElo, loserElo) {
    const K = 32; // K-factor impacts how much rating changes per match
    const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    return Math.round(K * (1 - expectedWin));
}

// Determine next pair to show
function loadNextMatch() {
    if (currentMatchRound >= targetMatches) {
        handleWinner();
        return;
    }

    // Pick two colors deterministically to balance matches
    // Sort all colors by fewest matches played, then randomly
    let candidates = [...allColors];
    shuffle(candidates); // shuffle first to break ties
    candidates.sort((a, b) => a.matches - b.matches);

    currentLeft = candidates[0];
    // To find an opponent, select from the next few with low match counts
    // but avoid matching against exact same color
    let secondIdx = 1;
    
    // Attempt to find a color with similar Elo from top pool
    let bestOpponent = candidates[1];
    let bestEloDiff = Math.abs(currentLeft.elo - bestOpponent.elo);

    // Check up to 5 neighbors to find a close match
    for(let i = 2; i < Math.min(6, candidates.length); i++) {
        let diff = Math.abs(currentLeft.elo - candidates[i].elo);
        if (diff < bestEloDiff) {
            bestEloDiff = diff;
            bestOpponent = candidates[i];
        }
    }
    
    currentRight = bestOpponent;

    swatchLeft.style.backgroundColor = currentLeft.hex;
    hexLeft.innerText = currentLeft.hex;
    nameLeft.innerText = currentLeft.name;
    
    swatchRight.style.backgroundColor = currentRight.hex;
    hexRight.innerText = currentRight.hex;
    nameRight.innerText = currentRight.name;
}

// Register a click on a color box
function handleChoice(winner, loser, winEl, loseEl) {
    if (winEl && loseEl) {
        // Prevent click spamming while animating
        colorLeft.style.pointerEvents = "none";
        colorRight.style.pointerEvents = "none";

        winEl.classList.add("animate-win");
        loseEl.classList.add("animate-lose");

        setTimeout(() => {
            winEl.classList.remove("animate-win");
            loseEl.classList.remove("animate-lose");
            
            colorLeft.style.pointerEvents = "auto";
            colorRight.style.pointerEvents = "auto";
            
            processChoice(winner, loser);
        }, 400); // 400ms matches the CSS animation duration
    } else {
        processChoice(winner, loser);
    }
}

function processChoice(winner, loser) {
    // Calculate Elo change
    const delta = calculateEloChange(winner.elo, loser.elo);
    winner.elo += delta;
    loser.elo -= delta;

    winner.matches++;
    loser.matches++;

    currentMatchRound++;
    updateProgress();
    loadNextMatch();
}

// Update UI progress tracker
function updateProgress() {
    currentMatchSpan.innerText = currentMatchRound + 1 > targetMatches ? targetMatches : currentMatchRound + 1;
    totalMatchesSpan.innerText = targetMatches;
    const pct = (currentMatchRound / targetMatches) * 100;
    progressBarFill.style.width = `${pct}%`;
}

// View Controller
function showView(viewElement) {
    setupView.classList.remove("active");
    setupView.classList.add("hidden");
    
    tournamentView.classList.remove("active");
    tournamentView.classList.add("hidden");
    
    resultView.classList.remove("active");
    resultView.classList.add("hidden");

    viewElement.classList.remove("hidden");
    viewElement.classList.add("active");
}

// Finale Screen & Palettes
function handleWinner() {
    showView(resultView);
    // Sort all colors by Elo descending
    allColors.sort((a, b) => b.elo - a.elo);
    
    const winner = allColors[0]; // Highest Elo is winner

    leaderboard.innerHTML = "";
    
    // Display Top 5
    for(let i=0; i < Math.min(5, allColors.length); i++) {
        const c = allColors[i];
        
        const row = document.createElement("div");
        row.classList.add("leaderboard-item");
        
        row.innerHTML = `
            <div class="lb-rank">#${i + 1}</div>
            <div class="lb-swatch" style="background-color: ${c.hex}"></div>
            <div class="lb-details">
                <strong>${c.hex}</strong>
                <span>${c.name}</span>
            </div>
            <div class="lb-elo">Elo: ${c.elo}</div>
        `;
        leaderboard.appendChild(row);
    }

    // Generate Palette Options
    paletteWarm.innerHTML = ""; // Clear existing
    paletteCool.innerHTML = "";
    
    // Determine Temperature
    const isWarm = (winner.h <= 90 || winner.h >= 300);
    const warmBaseH = isWarm ? winner.h : (winner.h + 180) % 360;
    const coolBaseH = isWarm ? (winner.h + 180) % 360 : winner.h;

    // Generate Warm Palette
    addSwatch(paletteWarm, warmBaseH, winner.s, winner.l, "Warm Core");
    addSwatch(paletteWarm, (warmBaseH + 25) % 360, Math.min(100, winner.s + 10), Math.min(100, winner.l + 10), "Warm Accent");
    addSwatch(paletteWarm, (warmBaseH - 25 + 360) % 360, winner.s, Math.max(0, winner.l - 15), "Warm Shadow");
    addSwatch(paletteWarm, (warmBaseH + 15) % 360, 90, 85, "Warm Highlight");

    // Generate Cool Palette
    addSwatch(paletteCool, coolBaseH, winner.s, winner.l, "Cool Core");
    addSwatch(paletteCool, (coolBaseH + 25) % 360, Math.max(0, winner.s - 20), Math.max(0, winner.l - 10), "Cool Deep");
    addSwatch(paletteCool, (coolBaseH - 25 + 360) % 360, winner.s, Math.min(100, winner.l + 20), "Cool Wash");
    addSwatch(paletteCool, (coolBaseH - 15 + 360) % 360, 40, 20, "Cool Void");
}

// Add tiny color swatches to HTML
function addSwatch(container, h, s, l, labelText) {
    const hexVal = hslToHex(h, s, l);
    const div = document.createElement("div");
    div.classList.add("palette-swatch");
    div.style.backgroundColor = hexVal;
    
    // Adjust label visibility against background light/dark
    if (l > 75) {
        div.style.border = "1px solid #ccc";
    }

    const span = document.createElement("span");
    span.innerText = hexVal;

    div.title = labelText; // Tooltip on hover
    div.appendChild(span);
    container.appendChild(div);
}

// Event Listeners
colorCountInput.addEventListener("input", (e) => colorCountVal.innerText = e.target.value);
matchCountInput.addEventListener("input", (e) => matchCountVal.innerText = e.target.value);

startBtn.addEventListener("click", initTournament);
colorLeft.addEventListener("click", () => handleChoice(currentLeft, currentRight, colorLeft, colorRight));
colorRight.addEventListener("click", () => handleChoice(currentRight, currentLeft, colorRight, colorLeft));
restartBtn.addEventListener("click", () => showView(setupView));
window.addEventListener("resize", applyDeviceMode);
window.addEventListener("orientationchange", applyDeviceMode);
applyDeviceMode();
