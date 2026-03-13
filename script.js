const SUPABASE_URL = 'https://erouxtuagzdpkaywxqld.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laAnJCp0zc5FDr_h2WqgpA_PohjFjvM';

let db;
try {
    if (typeof supabase !== 'undefined') {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("DATABASE: Connection initialized.");
    } else {
        throw new Error("Supabase library not found.");
    }
} catch (err) {
    console.error("INITIALIZATION ERROR:", err.message);
}

// --- UTILITIES ---
function logSystem(message, isError = false) {
    const logEntries = document.getElementById('log-entries');
    if (!logEntries) return;
    const entry = document.createElement('div');
    entry.className = isError ? 'log-entry error-text' : 'log-entry';
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${isError ? '>> ERROR: ' : '>> '}${message}`;
    logEntries.prepend(entry);
}

function assistantSpeak(text) {
    const aiName = document.getElementById('ai-name');
    if (aiName) aiName.innerText = text;
    console.log("ASSISTANT:", text);
}

// --- AUTHENTICATION ---
async function handleLogin() {
    try {
        if (!db) throw new Error("Database offline.");
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;

        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        assistantSpeak("Identity confirmed. Systems online.");
        fetchHabits();
    } catch (err) {
        logSystem("ACCESS DENIED: " + err.message, true);
    }
}

async function handleSignUp() {
    try {
        if (!db) throw new Error("Database offline.");
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await db.auth.signUp({ email, password });
        if (error) throw error;

        logSystem("PROTOCOL SUCCESS: Account created. Initializing session...");
        // Since email confirm is OFF, we can log in immediately
        handleLogin();
    } catch (err) {
        logSystem("SIGN UP ERROR: " + err.message, true);
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
                    <button onclick="completeHabit('${h.id}', ${h.streak_count})" class="game-btn">
                        ${isBoss ? 'FINISH' : 'COMPLETE'}
                    </button>
                </div>
            `;
        }).join('');

        updateGoalProgress(data);
        updateSocialLink(data);
    } catch (err) {
        logSystem("FETCH ERROR: " + err.message, true);
    }
}

function updateSocialLink(habits) {
    const totalStreak = habits.reduce((acc, h) => acc + (h.streak_count || 0), 0);
    const rank = Math.floor(totalStreak / 10) + 1;
    const bondPercent = (totalStreak % 10) * 10;
    
    document.getElementById('social-rank').innerText = rank;
    document.getElementById('bond-fill').style.width = bondPercent + "%";
    
    const status = document.getElementById('bond-status');
    if (rank < 3) status.innerText = "STRANGER";
    else if (rank < 6) status.innerText = "ACQUAINTANCE";
    else status.innerText = "SOUL BOUND";
}

function updateGoalProgress(habits) {
    const total = habits.reduce((acc, h) => acc + (h.streak_count || 0), 0);
    const percent = Math.min((total / 50) * 100, 100);
    const bar = document.getElementById('momentum-fill');
    if (bar) bar.style.width = percent + "%";
}

function handleLogout() {
    db.auth.signOut();
    location.reload();
}

function restartProtocol() {
    document.getElementById('failure-overlay').classList.add('failure-hidden');
    fetchHabits();
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

async function completeHabit(id, currentStreak) {
    try {
        if (!db) throw new Error("Connection Lost");
        
        const newStreak = currentStreak + 1;
        const { data, error } = await db
            .from('habits')
            .update({ streak_count: newStreak })
            .eq('id', id)
            .select();

        if (error) throw error;

        logSystem(`MISSION UPDATED: Streak is now ${newStreak}`);
        
        // Find if this was a Boss habit
        const updatedHabit = data[0];
        if (updatedHabit.name.toUpperCase().includes("BOSS") && newStreak >= 10) {
            triggerBossDefeated(updatedHabit.name);
        } else {
            assistantSpeak("Target hit. Keep the momentum.");
        }
        
        fetchHabits(); // Refresh UI
    } catch (err) {
        logSystem("UPDATE_FAILED: " + err.message, true);
    }
}
function triggerBossDefeated(bossName) {
    const overlay = document.getElementById('boss-defeat-overlay');
    if (overlay) {
        overlay.querySelector('.boss-name').innerText = bossName.toUpperCase() + " ELIMINATED";
        overlay.classList.remove('victory-hidden');
        
        // Visual flair: Grayscale the background briefly
        document.getElementById('main-content').style.filter = "grayscale(100%) contrast(200%)";
        
        assistantSpeak("Ranker destroyed. Your influence grows.");

        // Auto-hide after 4 seconds
        setTimeout(() => {
            overlay.classList.add('victory-hidden');
            document.getElementById('main-content').style.filter = "none";
        }, 4000);
    }
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
function restartProtocol() {
    // This hides the failure screen and resets the UI
    const failureOverlay = document.getElementById('failure-overlay');
    if (failureOverlay) {
        failureOverlay.classList.add('failure-hidden');
    }
    assistantSpeak("System rebooted. Awaiting new instructions.");
    fetchHabits(); 
}
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
    function updateSocialLink(habits) {
    try {
        const totalStreak = habits.reduce((acc, h) => acc + (h.streak_count || 0), 0);
        
        // Calculate Rank (Every 10 total points = 1 Rank Up)
        const rank = Math.floor(totalStreak / 10) + 1;
        const bondPercent = (totalStreak % 10) * 10;
        
        // Update UI
        document.getElementById('social-rank').innerText = rank;
        document.getElementById('bond-fill').style.width = bondPercent + "%";
        
        // Update Status Text
        const status = document.getElementById('bond-status');
        if (rank < 3) status.innerText = "STRANGER";
        else if (rank < 6) status.innerText = "ACQUAINTANCE";
        else if (rank < 9) status.innerText = "RELIABLE ALLY";
        else status.innerText = "SOUL BOUND";

    } catch (err) {
        console.error("SOCIAL_LINK_ERROR:", err.message);
    }
}}async function handleSignUp() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await db.auth.signUp({ email, password });
        
        if (error) throw error;

        logSystem("PROTOCOL SUCCESS: User created. Attempting auto-login...");
        
        // Automatically log them in since we disabled email confirmation
        await handleLogin(); 
        
    } catch (err) {
        logSystem("SIGN UP ERROR: " + err.message, true);
    }
}
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
