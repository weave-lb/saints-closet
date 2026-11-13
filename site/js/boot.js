// Runs in <head>, before first paint, so reveal styles apply from the start. Kept out of the page itself because
// the Content-Security-Policy allows scripts from this site only.
document.documentElement.classList.add('js');
