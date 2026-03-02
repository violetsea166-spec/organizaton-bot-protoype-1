const SUPABASE_URL = "YOUR_URL_HERE";
const SUPABASE_KEY = "YOUR_KEY_HERE";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- JARVIS SCOLDING FEATURE ---
function scoldUser(habitName) {
    document.body.classList.add('scold-active');
    assistantSpeak(`Master, your streak for ${habitName} has reset. This inconsistency is... disappointing. Do better.`);
    setTimeout(() => document.body.classList.remove('scold-active'), 2000);
}

// --- SYSTEM LOGGING ---
function logSystem(msg, isErr = false) {
    const logs = document.getElementById('log-entries');
    logs.innerHTML = `<div class="${isErr ? 'error' : ''}">[${new Date().toLocaleTimeString()}] ${msg}</div>` + logs.innerHTML;
}

// --- VICTORY PROTOCOL ---
function triggerVictory() {
    const overlay = document.getElementById('victory-overlay');
    overlay.classList.remove('victory-hidden');
    
    // JARVIS Congratulates you
    assistantSpeak("Extraordinary work, Master. You've maintained the protocol for a full week. Your momentum is undeniable.");
    
    // Hide after 5 seconds
    setTimeout(() => {
        overlay.classList.add('victory-hidden');
    }, 5000);
}

// --- UPDATE YOUR COMPLETE HABIT FUNCTION ---
async function completeHabit(id, currentStreak, lastCompleted) {
    // ... (Your existing date check logic) ...

    let newStreak = (lastDate === yesterday.toDateString()) ? currentStreak + 1 : 1;

    // CHECK FOR VICTORY
    if (newStreak === 7) {
        triggerVictory();
    }

    const { error } = await supabase
        .from('habits')
        .update({ streak_count: newStreak, last_completed: new Date().toISOString() })
        .eq('id', id);

    if (error) logSystem(error.message, true);
    else fetchHabits();
}// --- STREAK CALCULATION ---
async function completeHabit(id, currentStreak, lastCompleted) {
    const today = new Date().toDateString();
    const lastDate = lastCompleted ? new Date(lastCompleted).toDateString() : null;

    if (today === lastDate) {
        logSystem("Already completed today.");
        return;
    }

    // If you missed more than 1 day, it resets to 1. If 1 day ago, it adds +1.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = 1;
    if (lastDate === yesterday.toDateString()) {
        newStreak = currentStreak + 1;
    } else if (lastDate !== null) {
        scoldUser("this task"); // Trigger scolding if streak was broken
    }

    const { error } = await supabase
        .from('habits')
        .update({ streak_count: newStreak, last_completed: new Date().toISOString() })
        .eq('id', id);

    if (error) logSystem(error.message, true);
    else fetchHabits();
}

// Add your handleLogin and fetchHabits from before here!
async function fetchHabits() {
    try {
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const grid = document.getElementById('habit-grid');
        grid.innerHTML = data.map(h => `
            <div class="habit-pin">
                <h3>${h.name}</h3>
                <div class="streak-counter">🔥 ${h.streak_count || 0} Day Streak</div>
                <button onclick="completeHabit('${h.id}', ${h.streak_count}, '${h.last_completed}')" class="game-btn">
                    COMPLETE MISSION
                </button>
            </div>
        `).join('');
    } catch (err) {
        logSystem("FETCH_ERROR: " + err.message, true);
    }
}
