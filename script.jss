// 1. Change the Assistant/Theme color
function changeTheme(type) {
  const root = document.documentElement;
  
  if (type === 'fire') {
    root.style.setProperty('--primary-color', '#ff4b2b');
    root.style.setProperty('--bg-overlay', 'rgba(50, 0, 0, 0.7)');
  } else if (type === 'ocean') {
    root.style.setProperty('--primary-color', '#00d2ff');
    root.style.setProperty('--bg-overlay', 'rgba(0, 20, 50, 0.7)');
  }
}

// 2. Update Wallpaper from Input
function updateBG(url) {
  document.documentElement.style.setProperty('--bg-image', `url(${url})`);
}

// 3. Simple "Human" touch
const assistant = document.getElementById('assistant-greeting');
setTimeout(() => {
  assistant.innerText = "You look like you're ready to be productive today!";
}, 3000);
