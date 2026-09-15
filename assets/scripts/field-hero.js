(function () {
  'use strict';

  var section = document.querySelector('.field-hero');
  var stage = document.querySelector('.field-stage');
  var video = document.getElementById('field-hero-video');

  if (!section || !stage || !video) return;

  var targetProgress = 0;
  var renderedProgress = -1;
  var frame = 0;
  var sticky = stage.closest('.field-sticky');

  var effectiveDuration = 0;
  var seekPending = false;
  var videoReady = false;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function updateProgress() {
    var rect = section.getBoundingClientRect();
    document.body.classList.toggle('field-hero-active', rect.bottom > 0 && rect.top < window.innerHeight);
    var stickyStyle = window.getComputedStyle(sticky);
    var stickyTop = parseFloat(stickyStyle.top) || 0;
    var stickyHeight = sticky.offsetHeight;
    var scrollable = Math.max(section.offsetHeight - stickyHeight - stickyTop, 1);
    targetProgress = clamp(-rect.top / scrollable, 0, 1);

    if (Math.abs(targetProgress - renderedProgress) > 0.0005) {
      renderedProgress = targetProgress;
      section.style.setProperty('--field-progress', targetProgress.toFixed(4));
    }
  }

  function markReady() {
    if (videoReady) return;
    videoReady = true;
    effectiveDuration = Number.isFinite(video.duration) ? video.duration : 0;
    try { video.currentTime = 0; } catch (e) {}
    video.loop = false;
    video.pause();
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

  function updateScene() {
    if (!effectiveDuration || seekPending) return;
    var target = targetProgress * effectiveDuration;
    if (Math.abs(video.currentTime - target) > 0.03) {
      try { video.currentTime = target; } catch (e) {}
    }
  }

  function render() {
    frame = 0;
    updateProgress();
    updateScene();
  }

  function requestFrame() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  window.addEventListener('orientationchange', requestFrame);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', requestFrame);
  }
  requestFrame();
  section.classList.add('is-ready');
}());

// Copyright RZU Informatique
