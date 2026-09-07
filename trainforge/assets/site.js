// Pause the research demo when its tab is in the background.
const video = document.querySelector('video');
document.addEventListener('visibilitychange', () => {
  if (document.hidden && video && !video.paused) video.pause();
});
