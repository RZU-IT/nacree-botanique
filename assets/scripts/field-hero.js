(function () {
  'use strict';

  var section = document.querySelector('.field-hero');
  var stage = document.querySelector('.field-stage');
  var video = document.getElementById('field-hero-video');

  if (!section || !stage || !video) return;

  var targetProgress = 0;
  var progress = 0;
  var frame = 0;
  var lastTime = performance.now();

  var effectiveDuration = null;
  var seekPending = false;
  var videoReady = false;
  var primed = false;
  var interactionPending = false;
  var objectUrl = '';

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function readScrollProgress() {
    var rect = section.getBoundingClientRect();
    var scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
    targetProgress = clamp(-rect.top / scrollable, 0, 1);
    section.style.setProperty('--field-progress', targetProgress.toFixed(4));
    requestFrame();
  }

  function calibrateDuration() {
    if (effectiveDuration !== null) return;
    function onCalibrated() {
      video.removeEventListener('seeked', onCalibrated);
      effectiveDuration = video.currentTime > 0.1 ? video.currentTime : (video.duration || 0);
      seekPending = false;
      try { video.currentTime = 0; } catch (e) {}
    }
    video.addEventListener('seeked', onCalibrated);
    try {
      seekPending = true;
      video.currentTime = 999999;
    } catch (e) {
      effectiveDuration = video.duration || 0;
      seekPending = false;
    }
  }

  function markReady() {
    if (videoReady) return;
    videoReady = true;
    calibrateDuration();
  }

  video.addEventListener('loadedmetadata', markReady);
  video.addEventListener('loadeddata', markReady);
  video.addEventListener('canplay', markReady);
  if (video.readyState >= 1) markReady();

  video.addEventListener('seeking', function () { seekPending = true; });
  video.addEventListener('seeked', function () {
    seekPending = false;
    requestFrame();
  });

  function primeVideo() {
    interactionPending = true;
    if (!video.src) return;
    if (primed) return;
    primed = true;
    video.muted = true;
    var p = video.play();
    if (p && p.then) {
      p.then(function () {
        video.pause();
        video.currentTime = 0;
        markReady();
      }).catch(function () {});
    }
  }
  window.addEventListener('scroll', primeVideo, { once: true, passive: true });
  window.addEventListener('touchstart', primeVideo, { once: true, passive: true });

  function applyVideoSource(source) {
    video.src = source;
    video.load();
    if (interactionPending) primeVideo();
  }

  var videoSource = video.getAttribute('data-src');
  if (videoSource && window.fetch && window.URL && window.URL.createObjectURL) {
    window.fetch(videoSource)
      .then(function (response) {
        if (!response.ok) throw new Error(String(response.status));
        return response.blob();
      })
      .then(function (blob) {
        objectUrl = window.URL.createObjectURL(blob);
        applyVideoSource(objectUrl);
      })
      .catch(function () {
        applyVideoSource(videoSource);
      });
  } else if (videoSource) {
    applyVideoSource(videoSource);
  }

  window.addEventListener('pagehide', function () {
    if (objectUrl) window.URL.revokeObjectURL(objectUrl);
  });

  function updateScene() {
    if (!effectiveDuration || seekPending) return;
    var target = progress * effectiveDuration;
    if (Math.abs(video.currentTime - target) > 0.03) {
      try { video.currentTime = target; } catch (e) {}
    }
  }

  function render(now) {
    frame = 0;
    var delta = Math.min(Math.max((now - lastTime) * 0.001, 0.001), 0.05);
    lastTime = now;
    progress += (targetProgress - progress) * (1 - Math.exp(-11 * delta));

    if (Math.abs(targetProgress - progress) < 0.00015) progress = targetProgress;
    updateScene();
    if (Math.abs(targetProgress - progress) >= 0.00015) requestFrame();
  }

  function requestFrame() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', readScrollProgress, { passive: true });
  window.addEventListener('resize', readScrollProgress);
  readScrollProgress();
  section.classList.add('is-ready');
}());
