const SUPABASE_URL = 'https://erouxtuagzdpkaywxqld.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laAnJCp0zc5FDr_h2WqgpA_PohjFjvM';

let db;
try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
    console.error("Connection Error:", err);
}

// --- CORE AUTHENTICATION ---

async function handleLogin() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            logSystem("ERROR: Email and Passkey required.", true);
            return;
        }

        const { data, error } = await db.auth.signInWithPassword({ email, password });
        
        if (error) {
            logSystem("ACCESS DENIED: " + error.message, true);
        } else {
            // Success: Hide login, show app
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            logSystem("IDENTITY CONFIRMED. Systems online.");
            fetchHabits(); // Load your data
        }
    } catch (err) {
        console.error("Login Crash:", err);
    }
}

async function handleSignUp() {
    try {
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
            logSystem("PROTOCOL SUCCESS: User created.");
            // Note: If you haven't disabled 'Confirm Email' in Supabase, 
            // the user won't be able to login until they click the email link.
            assistantSpeak("Registration complete. Please initialize login.");
        }
    } catch (err) {
        console.error("Sign Up Crash:", err);
    }
}

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

// --- HABIT LOGIC ---
async function fetchHabits() {
    const { data, error } = await db.from('habits').select('*');
    if (error) return;

    const grid = document.getElementById('habit-grid');
    grid.innerHTML = data.map(h => `
        <div class="habit-pin">
            <h3>${h.name}</h3>
            <div class="streak-badge">🔥 ${h.streak_count || 0}</div>
            <button onclick="completeHabit('${h.id}', ${h.streak_count})" class="game-btn">MISSION COMPLETE</button>
        </div>
    `).join('');

    updateSocialLink(data);
}

async function completeHabit(id, currentStreak) {
    const { error } = await db.from('habits').update({ streak_count: currentStreak + 1 }).eq('id', id);
    if (!error) fetchHabits();
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
