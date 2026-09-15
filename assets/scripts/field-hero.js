(function () {
  'use strict';

  var section = document.querySelector('.field-hero');
  var stage = document.querySelector('.field-stage');
  var video = document.getElementById('field-hero-video');

  if (!section || !stage || !video) return;

  var targetProgress = 0;
  var frame = 0;

  var effectiveDuration = 0;
  var seekPending = false;
  var videoReady = false;
  var queuedTime = 0;
  var compactQuery = window.matchMedia('(max-width: 680px)');

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function readScrollProgress() {
    if (compactQuery.matches) {
      section.style.setProperty('--field-progress', '1');
      return;
    }
    var rect = section.getBoundingClientRect();
    var stickyStyle = window.getComputedStyle(stage.closest('.field-sticky'));
    var stickyTop = parseFloat(stickyStyle.top) || 0;
    var stickyHeight = stage.closest('.field-sticky').offsetHeight;
    var scrollable = Math.max(section.offsetHeight - stickyHeight - stickyTop, 1);
    targetProgress = clamp(-rect.top / scrollable, 0, 1);
    section.style.setProperty('--field-progress', targetProgress.toFixed(4));
    requestFrame();
  }

  function markReady() {
    if (videoReady) return;
    videoReady = true;
    effectiveDuration = Number.isFinite(video.duration) ? video.duration : 0;
    try { video.currentTime = 0; } catch (e) {}
    if (compactQuery.matches) {
      video.loop = true;
      video.play().catch(function () {});
      return;
    }
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
    if (compactQuery.matches) return;
    if (!effectiveDuration || seekPending) return;
    var target = targetProgress * effectiveDuration;
    queuedTime = target;
    if (Math.abs(video.currentTime - target) > 0.03) {
      try { video.currentTime = target; } catch (e) {}
    }
  }

  function render() {
    frame = 0;
    updateScene();
  }

  function requestFrame() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', readScrollProgress, { passive: true });
  window.addEventListener('resize', readScrollProgress);
  window.addEventListener('orientationchange', readScrollProgress);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', readScrollProgress);
  }
  compactQuery.addEventListener('change', function () { window.location.reload(); });
  readScrollProgress();
  section.classList.add('is-ready');
}());

// Copyright RZU Informatique
