const SUPABASE_URL = 'https://erouxtuagzdpkaywxqld.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laAnJCp0zc5FDr_h2WqgpA_PohjFjvM';

let db;
try {
    if (typeof supabase !== 'undefined') {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("DATABASE: Connection initialized.");
    } else {
        throw new Error("Supabase library not found. Check your index.html script tags.");
    }
} catch (err) {
    console.error("INITIALIZATION ERROR:", err.message);
}

// --- UTILITY FUNCTIONS (Required for error handling) ---
function logSystem(message, isError = false) {
    const logEntries = document.getElementById('log-entries');
    if (!logEntries) return;
    const entry = document.createElement('div');
    entry.className = isError ? 'log-entry error' : 'log-entry';
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${isError ? '>> ERROR: ' : '>> '}${message}`;
    logEntries.prepend(entry);
    console.log(message);
}

function assistantSpeak(text) {
    console.log("ASSISTANT:", text);
    // Future ElevenLabs integration goes here
}

// --- AUTH LOGIC ---
async function handleLogin() {
    try {
        if (!db) throw new Error("Database offline.");
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) throw new Error("Credentials required.");

        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;

        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        assistantSpeak("Identity confirmed. Systems online.");
        fetchHabits();
    } catch (err) {
        logSystem(err.message, true);
        assistantSpeak("Access denied.");
    }
}

async function handleSignUp() {
    try {
        if (!db) throw new Error("Database offline.");
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) throw new Error("Email and Passkey required.");

        const { data, error } = await db.auth.signUp({ email, password });
        if (error) throw error;

        logSystem("PROTOCOL INITIATED: Check " + email + " for confirmation.");
        assistantSpeak("Registration complete. Please verify your identity via email.");
    } catch (err) {
        logSystem("SIGN UP FAILED: " + err.message, true);
    }
}

// --- CORE LOGIC ---
async function fetchHabits() {
    try {
        const { data, error } = await db.from('habits').select('*');
        if (error) throw error;

        const grid = document.getElementById('habit-grid');
        grid.innerHTML = data.map(h => {
            const isBoss = h.name.toUpperCase().includes("BOSS");
            return `
                <div class="habit-pin ${isBoss ? 'boss-habit' : ''}">
                    ${isBoss ? '<div class="boss-label">RANKER</div>' : ''}
                    <h3>${h.name}</h3>
                    <div class="streak-badge">🔥 ${h.streak_count || 0} Days</div>
                    ${isBoss ? `
                        <div class="boss-health-bar">
                            <div class="health-fill" style="width: ${Math.min(h.streak_count * 10, 100)}%"></div>
                        </div>
                    ` : ''}
                    <button onclick="completeHabit('${h.id}', ${h.streak_count})" class="game-btn">
                        ${isBoss ? 'FINISH HIM' : 'COMPLETE'}
                    </button>
                </div>
            `;
        }).join('');
        updateGoalProgress(data);
    } catch (err) {
        logSystem("FETCH ERROR: " + err.message, true);
    }
}

function updateGoalProgress(habits) {
    try {
        const totalStreak = habits.reduce((acc, h) => acc + (h.streak_count || 0), 0);
        const percent = Math.min((totalStreak / 50) * 100, 100);
        const bar = document.getElementById('momentum-fill');
        if (bar) bar.style.width = percent + "%";
    } catch (err) {
        console.error("GOAL UPDATE ERROR:", err.message);
    }
}

function triggerBossDefeated(bossName) {
    const overlay = document.getElementById('boss-defeat-overlay');
    if (overlay) {
        overlay.querySelector('.boss-name').innerText = bossName + " ELIMINATED";
        overlay.classList.remove('victory-hidden');
        assistantSpeak("Target destroyed. Your rank has increased.");
    }
}

function handleLogout() {
    db.auth.signOut();
    location.reload(); // Quick reset
}
const isBoss = h.name.toUpperCase().includes("BOSS");

// In the return string for the button:
<button onclick="completeHabit('${h.id}', ${h.streak_count}, '${h.last_completed}')" class="game-btn">
    ${isBoss ? 'FINISH HIM' : 'COMPLETE MISSION'}
</button>
// This fixed the missing ) error. Now the script can breathe!        
    }
}

// --- CORE HABIT LOGIC ---
async function fetchHabits() {
    try {
        const { data, error } = await db.from('habits').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const grid = document.getElementById('habit-grid');
        grid.innerHTML = data.map(h => `
            <div class="habit-pin">
                <h3>${h.name}</h3>
                <div class="streak-badge">🔥 ${h.streak_count || 0} Days</div>
                <button onclick="completeHabit('${h.id}', ${h.streak_count}, '${h.last_completed}')" class="game-btn">COMPLETE</button>
            </div>
        `).join('');

        let total = data.reduce((acc, h) => acc + (h.streak_count || 0), 0);
        document.getElementById('global-streak').innerText = total;
        updateSocialLink(total);
        checkForInactivity(data);
    } catch (err) { logSystem(err.message, true); }
}

async function completeHabit(id, currentStreak, lastCompleted) {
    const today = new Date().toDateString();
    const lastDate = lastCompleted ? new Date(lastCompleted).toDateString() : null;
    if (today === lastDate) { logSystem("Already completed today."); return; }

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    let newStreak = (lastDate === yesterday.toDateString()) ? currentStreak + 1 : 1;

    if (newStreak === 7) triggerVictory();
    if (lastDate !== null && lastDate !== yesterday.toDateString()) {
        scoldUser("this task");
    }

    const { error } = await db.from('habits').update({ streak_count: newStreak, last_completed: new Date().toISOString() }).eq('id', id);
    if (!error) fetchHabits();
}

// --- SOCIAL LINK ---
function updateSocialLink(total) {
    let rank = Math.min(Math.floor(total / 10) + 1, 10);
    document.getElementById('social-rank').innerText = rank;
    document.getElementById('bond-fill').style.width = (total % 10) * 10 + "%";
    const titles = ["STRANGER", "ACQUAINTANCE", "RELIABLE ASSET", "TRUSTED PARTNER", "CHOSEN COMMANDER"];
    document.getElementById('bond-status').innerText = titles[Math.min(Math.floor(rank/2), 4)];
}

// --- OVERLAYS & ERRORS ---
function logSystem(msg, isErr = false) {
    const logs = document.getElementById('log-entries');
    logs.innerHTML = `<div class="log-entry ${isErr ? 'error' : ''}">[${new Date().toLocaleTimeString()}] ${msg}</div>` + logs.innerHTML;
}

function triggerVictory() { document.getElementById('victory-overlay').classList.remove('victory-hidden'); assistantSpeak("Victory achieved, Master."); }
function restartProtocol() { document.getElementById('failure-overlay').classList.add('failure-hidden'); }
function scoldUser(name) { assistantSpeak(`Your streak for ${name} has reset. Disappointing.`); }

function checkForInactivity(habits) {
    const fortyEightHours = 48 * 60 * 60 * 1000;
    habits.forEach(h => {
        if (h.last_completed && (new Date() - new Date(h.last_completed) > fortyEightHours) && h.streak_count > 0) {
            triggerFailure();
        }
    });
}
function triggerFailure() { document.getElementById('failure-overlay').classList.remove('failure-hidden'); assistantSpeak("Mission failed. Focus lost."); }
async function addNewHabit() {
    const name = document.getElementById('habitName').value;
    if (!name) return;

    const { data: { user } } = await db.auth.getUser();
    const { error } = await db.from('habits').insert([
        { name: name, user_id: user.id, streak_count: 0 }
    ]);

    if (error) logSystem(error.message, true);
    else {
        document.getElementById('habitName').value = '';
        fetchHabits();
    }
}

function handleLogout() {
    db.auth.signOut();
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    assistantSpeak("Systems powering down. Goodbye, Master.");
}
function updateGoalProgress(habits) {
    const goalList = document.getElementById('goal-list');
    // Example: A goal to hit a total of 50 cumulative streak days
    const totalStreak = habits.reduce((acc, h) => acc + (h.streak_count || 0), 0);
    const target = 50;
    const percent = Math.min((totalStreak / target) * 100, 100);
const bar = document.getElementById('momentum-fill');
    if (bar) {
        bar.style.width = percent + "%";
    }
    async function handleSignUp() {
    if (!db) return;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await db.auth.signUp({ email, password });
    
    if (error) {
        logSystem("SIGN UP ERROR: " + error.message, true);
    } else {
        logSystem("PROTOCOL INITIATED: Check your email to confirm account!");
        assistantSpeak("Registration protocol complete. Please verify your identity via email.");
    }
}
    goalList.innerHTML = `
        <div class="goal-item">
            <span class="rank-num">#01</span>
            <span class="goal-text">REACH THE TOP (50 DAYS)</span>
            <div class="goal-progress-bar">
                <div style="width: ${percent}%"></div>
            </div>
        </div>
    `;
}
function triggerBossDefeated(bossName) {
    const overlay = document.getElementById('boss-defeat-overlay');
    overlay.querySelector('.boss-name').innerText = bossName + " ELIMINATED";
    overlay.classList.remove('victory-hidden');
    assistantSpeak("Target destroyed. Your rank has increased.");
}
