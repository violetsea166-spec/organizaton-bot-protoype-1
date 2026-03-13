const SUPABASE_URL = 'https://erouxtuagzdpkaywxqld.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laAnJCp0zc5FDr_h2WqgpA_PohjFjvM';

let db;
try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
    console.error("Connection Error:", err);
}

// --- CORE AUTH ---
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

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await db.auth.signUp({ email, password });
    
    if (error) {
        logSystem("SIGN UP ERROR: " + error.message, true);
    } else {
        logSystem("PROTOCOL SUCCESS: Account created. You can now login.");
        assistantSpeak("Registration complete. Initialize system access.");
    }
}

// --- SOCIAL LINK SYSTEM ---
let currentRank = 1;

function updateSocialLink(habits) {
    const totalStreak = habits.reduce((acc, h) => acc + (h.streak_count || 0), 0);
    const newRank = Math.floor(totalStreak / 10) + 1;
    
    // Trigger Animation if Rank increases
    if (newRank > currentRank) {
        triggerRankUp(newRank);
        currentRank = newRank;
    }

    document.getElementById('social-rank').innerText = currentRank;
    const bondPercent = (totalStreak % 10) * 10;
    document.getElementById('bond-fill').style.width = bondPercent + "%";
}

function triggerRankUp(rank) {
    const overlay = document.getElementById('boss-defeat-overlay');
    overlay.innerHTML = `
        <div class="rank-card-inner">
            <div class="tarot-card">⭐</div>
            <div class="rank-up-text">RANK UP: ${rank}</div>
            <div class="boss-name">THE BOND DEEPENS</div>
        </div>
    `;
    overlay.classList.remove('victory-hidden');
    
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
