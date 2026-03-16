const SUPABASE_URL = 'https://erouxtuagzdpkaywxqld.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laAnJCp0zc5FDr_h2WqgpA_PohjFjvM';

let db;
try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
    console.error("Connection Error:", err);
}

// --- STABLE AUTH LOGIC ---

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        logSystem("ERROR: Enter credentials.", true);
        return;
    }

    const { data, error } = await db.auth.signInWithPassword({ email, password });
    
    if (error) {
        logSystem("LOGIN FAILED: " + error.message, true);
    } else {
        // SUCCESS: Only switch screens now
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        logSystem("ACCESS GRANTED. Initializing JARVIS...");
        
        // Load the data now that we are inside
        fetchHabits();
    }
}

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        logSystem("ERROR: Email and Passkey required.", true);
        return;
    }

    const { data, error } = await db.auth.signUp({ email, password });
    
    if (error) {
        logSystem("SIGN UP ERROR: " + error.message, true);
    } else {
        logSystem("PROTOCOL SUCCESS: Account created.");
        assistantSpeak("User registered. You can now use INITIALIZE to log in.");
        
        // Clear the fields so the user knows they are done
        document.getElementById('password').value = "";
    }
}
// CRITICAL: Make sure this is NOT running at the bottom of your script anymore
// fetchHabits(); <--- REMOVE THIS LINE IF IT IS FLOATING AT THE BOTTOM

let currentRank = 1; // Track this globally at the top of your script

function updateSocialLink(habits) {
    try {
        const totalStreak = habits.reduce((acc, h) => acc + (h.streak_count || 0), 0);
        
        // Logic: Rank increases every 10 total points
        const newRank = Math.floor(totalStreak / 10) + 1;
        const bondPercent = (totalStreak % 10) * 10;
        
        // Trigger Animation ONLY on Rank Up
        if (newRank > currentRank) {
            triggerRankUp(newRank);
            currentRank = newRank;
function triggerRankUp(newRank) {
    // 1. Play the Persona 5 Rank Up Chime
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); 
    chime.volume = 0.5;
    chime.play();

    // 2. Show the level-up overlay (Social Link style)
    const overlay = document.getElementById('boss-defeat-overlay');
    if (overlay) overlay.classList.remove('victory-hidden');

    // 3. JARVIS Voice via ElevenLabs
    assistantSpeak(`Social Link established. You have reached Rank ${newRank}. Impressive work, Admin.`);

    // 4. Hide overlay after 4 seconds
    setTimeout(() => {
        if (overlay) overlay.classList.add('victory-hidden');
    }, 4000);
}
        }

        // Update UI
        document.getElementById('social-rank').innerText = currentRank;
        document.getElementById('bond-fill').style.width = bondPercent + "%";
        
        const status = document.getElementById('bond-status');
        if (currentRank < 3) status.innerText = "STRANGER";
        else if (currentRank < 6) status.innerText = "CONFIDANT";
        else if (currentRank < 9) status.innerText = "RELIABLE ALLY";
        else status.innerText = "SOUL BOUND";

    } catch (err) {
        console.error("SOCIAL_LINK_ERROR:", err.message);
    }
}

function triggerRankUp(rank) {
    const overlay = document.getElementById('boss-defeat-overlay');
    
    // Change the overlay content to the Rank Up style
    overlay.innerHTML = `
        <div class="rank-card-animation">
            <div class="card-glow"></div>
            <div class="tarot-icon">★</div>
            <div class="rank-up-text">RANK UP</div>
            <div class="rank-number">${rank}</div>
            <div class="bond-desc">I am thou, thou art I...</div>
        </div>
    `;
    
    overlay.classList.remove('victory-hidden');
    assistantSpeak("Your resolve strengthens our bond. Rank Up achieved.");

    // Auto-hide after 4 seconds
    setTimeout(() => {
        overlay.classList.add('victory-hidden');
    }, 4000);
}

async function fetchHabits() {
    // 1. Fetch data from Supabase
    const { data, error } = await db.from('habits').select('*');
    if (error) {
        logSystem("DATABASE ERROR: " + error.message, true);
        return;
    }

    const grid = document.getElementById('habit-grid');
    if (!grid) return;

    // 2. Mission Failed Check (If a streak is missed)
    const now = new Date();
    let failureDetected = false;

    data.forEach(h => {
        if (h.streak_count > 0 && h.last_updated) {
            const lastUpdate = new Date(h.last_updated);
            const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);
            
            // If it's been over 24 hours since the last mission completion
            if (hoursSince > 24) { 
                resetStreakInDB(h.id); 
                failureDetected = true;
            }
        }
    });

    if (failureDetected) {
        triggerMissionFailure(); // Triggers grayscale and JARVIS voice
        return; // Stop rendering until the user clicks Reinitialize
    }

    // 3. Render the habits WITH the STREAK BADGE
    grid.innerHTML = data.map(h => `
        <div class="habit-pin">
            <div class="habit-header">
                <h3>${h.name || "New Mission"}</h3>
                <div class="streak-badge">
                    <span class="fire-icon">🔥</span> 
                    <span class="count">${h.streak_count || 0}</span>
                </div>
            </div>
            
            <button onclick="completeHabit('${h.id}', ${h.streak_count || 0})" class="game-btn">
                MISSION COMPLETE
            </button>
        </div>
    `).join('');
}

    const grid = document.getElementById('habit-grid');
    if (grid && data) {
        grid.innerHTML = data.map(h => `
            <div class="habit-pin">
                <h3>${h.name || "New Mission"}</h3>
                <div class="streak-badge">🔥 ${h.streak_count || 0}</div>
                <button onclick="completeHabit('${h.id}', ${h.streak_count || 0})" class="game-btn">
                    MISSION COMPLETE
                </button>
            </div>
        `).join('');
    }
    
    // This updates your Social Link rank
    if (typeof updateSocialLink === "function") updateSocialLink(data);
}
async function completeHabit(id, currentStreak) {
    const newStreak = (currentStreak || 0) + 1;
    const now = new Date().toISOString(); // Records the exact moment of completion

    const { error } = await db
        .from('habits')
        .update({ 
            streak_count: newStreak,
            last_updated: now // This stops the "Mission Failed" from triggering falsely
        })
        .eq('id', id);

    if (!error) {
        logSystem("MISSION COMPLETE: Data synced.");
        fetchHabits(); 
    }
}

function logSystem(message, isError = false) {
    const log = document.getElementById('log-entries');
    const entry = document.createElement('div');
    entry.className = isError ? 'error-text' : '';
    entry.innerText = `>> ${message}`;
    log.prepend(entry);
}

function assistantSpeak(text) {
    document.getElementById('ai-name').innerText = text;
}
// FIND THIS LINE at the bottom of your file:
// fetchHabits(); <--- DELETE OR COMMENT THIS OUT

// REPLACE IT WITH THIS:
window.onload = () => {
    console.log("System on standby. Awaiting authentication...");
    // We only call fetchHabits() inside the handleLogin() function now.
};
// --- EMERGENCY BYPASS PROTOCOL ---
// Forces the UI to show the dashboard without a login
window.addEventListener('load', () => {
    console.log("BYPASS: Initializing JARVIS without authentication...");
    
    setTimeout(() => {
        const authSection = document.getElementById('auth-section');
        const mainContent = document.getElementById('main-content');
        
        if (authSection && mainContent) {
            authSection.style.display = 'none';
            mainContent.style.display = 'block';
            
            // Try to fetch habits, but don't crash if database is still waking up
            if (typeof fetchHabits === "function") {
                fetchHabits().catch(err => console.warn("Database fetch skipped during bypass."));
            }
            
            logSystem("BYPASS ACTIVE: Identity verification skipped.");
            assistantSpeak("Welcome back. Systems forced online.");
        }
    }, 500);
});
// ==========================================
// JARVIS VOICE & BYPASS MODULE
// ==========================================

const ELEVENLABS_API_KEY = 'sk_e488b065cb727d2a7dbc69a8aa5388bcc477484de49256ac'; // Add your key from ElevenLabs
const VOICE_ID = 'pNInz6obpg8n9icWJwpf'; // A deep, JARVIS-style voice

async function assistantSpeak(text) {
    console.log("JARVIS:", text);
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        }
    } catch (err) {
        console.error("Voice Error:", err);
    }
}

// --- PERSONA 5 RANK UP (Chime + Voice) ---
function triggerRankUp(rank) {
    // 1. Play the "Shwing" Chime
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); 
    chime.volume = 0.6;
    chime.play();

    // 2. Show the Overlay
    const overlay = document.getElementById('boss-defeat-overlay');
    overlay.classList.remove('victory-hidden');

    // 3. JARVIS Speaks the Rank Up
    setTimeout(() => {
        assistantSpeak(`Social Link established. You have reached Rank ${rank}.`);
    }, 800);

    // Hide after 5 seconds
    setTimeout(() => {
        overlay.classList.add('victory-hidden');
    }, 5000);
}

// --- EMERGENCY BYPASS ---
window.addEventListener('load', () => {
    setTimeout(() => {
        const auth = document.getElementById('auth-section');
        const main = document.getElementById('main-content');
        
        if (auth && main) {
            auth.style.display = 'none';
            main.style.display = 'block';
            logSystem("BYPASS ENABLED: Welcome back, Admin.");
            
            // Start the system
            if (typeof fetchHabits === "function") fetchHabits();
            
            // Greeting
            assistantSpeak("Systems initialized. All protocols online.");
        }
    }, 1000);
});
// ==========================================
// GAME STATE TRIGGERS (FAILURE & SUCCESS)
// ==========================================

function triggerMissionFailure() {
    const failureOverlay = document.getElementById('failure-overlay');
    if (failureOverlay) {
        failureOverlay.classList.remove('failure-hidden');
    }
    
    // Apply the P5 "Despair" filter to the entire page
    document.body.style.filter = "grayscale(1) contrast(1.5) brightness(0.7)";
    
    // JARVIS speaks the failure line
    assistantSpeak("Consistency protocol terminated. You have allowed the streak to wither. Reinitialization required.");
}

function restartProtocol() {
    // Revert the visual filters
    document.body.style.filter = "none";
    
    // Refresh the page to reset the UI and try a clean fetch
    location.reload(); 
}
