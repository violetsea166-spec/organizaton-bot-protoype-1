
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// --- CONFIGURATION ---
const SUPABASE_URL = 'https://erouxtuagzdpkaywxqld.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laAnJCp0zc5FDr_h2WqgpA_PohjFjvM';
const ELEVEN_LABS_KEY = "YOUR_ELEVEN_LABS_KEY"; // Update this!


// --- VOICE ENGINE ---
async function assistantSpeak(text) {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    // Replace with ElevenLabs fetch call if key is provided
    console.log("JARVIS says: " + text);
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

// --- AUTHENTICATION ---
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
        logSystem("ACCESS DENIED: " + error.message, true);
    } else {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        assistantSpeak("Identity confirmed. Systems online.");
        fetchHabits();
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
