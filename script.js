const SUPABASE_URL = 'https://erouxtuagzdpkaywxqld.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laAnJCp0zc5FDr_h2WqgpA_PohjFjvM';

let db;
try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
    console.error("Connection Error:", err);
}

// --- STABLE AUTH LOGIC ---

let currentUserId = null;

function setAuthStatus(message, isError = false) {
    const statusEl = document.getElementById('auth-status');
    if (statusEl) {
        statusEl.innerText = message;
        statusEl.style.color = isError ? '#ff003c' : '#00d2ff'; // Persona styling colors
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        setAuthStatus("ERROR: Enter credentials.", true);
        return;
    }

    setAuthStatus("Authenticating...", false);
    const { data, error } = await db.from('users').select('*').eq('email', email).eq('password', password).maybeSingle();
    
    if (error || !data) {
        setAuthStatus("LOGIN FAILED: Invalid credentials", true);
    } else {
        // SUCCESS:
        setAuthStatus("", false);
        currentUserId = data.id;
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
        setAuthStatus("ERROR: Email and Passkey required.", true);
        return;
    }

    setAuthStatus("Creating protocol...", false);
    const { data, error } = await db.from('users').insert([{ email, password }]).select().single();
    
    if (error) {
        let msg = error.message;
        if (msg.includes("duplicate key value")) msg = "User already exists.";
        setAuthStatus("SIGN UP ERROR: " + msg, true);
    } else {
        setAuthStatus("Account created successfully! You may now click INITIALIZE to log in.", false);
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


async function fetchHabits() {
    if (!currentUserId) return;
    
    // 1. Fetch data from Supabase
    const { data, error } = await db.from('habits').select('*').eq('user_id', currentUserId);
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
                if (typeof resetStreakInDB === "function") resetStreakInDB(h.id); 
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
/*
window.addEventListener('load', () => {
    console.log("BYPASS: Initializing JARVIS without authentication...");
    
    setTimeout(async () => {
        const authSection = document.getElementById('auth-section');
        const mainContent = document.getElementById('main-content');
        
        if (authSection && mainContent) {
            authSection.style.display = 'none';
            mainContent.style.display = 'block';
            
            // Auto bypass logic: find or create an admin user in the custom users table
            const { data } = await db.from('users').select('*').eq('email', 'admin@jarvis.com').maybeSingle();
            if (data) {
                currentUserId = data.id;
            } else {
                const res = await db.from('users').insert([{ email: 'admin@jarvis.com', password: 'admin' }]).select().single();
                currentUserId = res.data?.id || null;
            }
            
            // Try to fetch habits, but don't crash if database is still waking up
            if (typeof fetchHabits === "function") {
                fetchHabits().catch(err => console.warn("Database fetch skipped during bypass.", err));
            }
            
            logSystem("BYPASS ACTIVE: Identity verification skipped.");
            assistantSpeak("Welcome back. Systems forced online.");
        }
    }, 500);
});
*/
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

    // 3. JARVIS Speaks the Rank Up
    setTimeout(() => {
        assistantSpeak(`Social Link established. You have reached Rank ${rank}.`);
    }, 800);

    // Hide after 5 seconds
    setTimeout(() => {
        overlay.classList.add('victory-hidden');
    }, 5000);
}

// ==========================================
// GAME STATE TRIGGERS (FAILURE & SUCCESS)
// ==========================================

function triggerMissionFailure() {
    const failureOverlay = document.getElementById('failure-overlay');
    if (failureOverlay) failureOverlay.classList.remove('failure-hidden');
    
    // Play the Emergency Alert Sound
    const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
    alertSound.volume = 0.4;
    alertSound.play();

    // Apply the P5 "Despair" filter to the entire page
    document.body.style.filter = "grayscale(1) contrast(1.5) brightness(0.7)";
    
    // JARVIS speaks the failure line
    assistantSpeak("Critical error. You have allowed the bond to wither. The streak has been terminated.");
}

function restartProtocol() {
    // Revert the visual filters
    document.body.style.filter = "none";
    
    // Refresh the page to reset the UI and try a clean fetch
    location.reload(); 
}

// ==========================================
// MISSING CORE FUNCTIONS
// ==========================================

async function resetStreakInDB(id) {
    const { error } = await db.from('habits').update({ streak_count: 0 }).eq('id', id);
    if (error) logSystem("ERROR resetting streak: " + error.message, true);
}

async function addNewHabit() {
    const nameInput = document.getElementById('habitName');
    const name = nameInput.value.trim();
    if (!name || !currentUserId) return;

    const { error } = await db.from('habits').insert([{
        name: name,
        streak_count: 0,
        last_updated: new Date().toISOString(),
        user_id: currentUserId
    }]);

    if (error) {
        logSystem("ERROR adding mission: " + error.message, true);
    } else {
        nameInput.value = '';
        logSystem("New active mission assigned.");
        fetchHabits();
    }
}

async function handleLogout() {
    currentUserId = null;
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    logSystem("SYSTEM DISCONNECTED.");
    assistantSpeak("Goodbye, Admin.");
}
