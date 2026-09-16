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
  var sectionTop = 0;
  var scrollRange = 1;
  var measuredWidth = 0;
  var lastScrollY = Math.max(window.scrollY, 0);
  var heroActive = null;

  var effectiveDuration = 0;
  var seekPending = false;
  var videoReady = false;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function measureScrollRange() {
    var rect = section.getBoundingClientRect();
    var stickyStyle = window.getComputedStyle(sticky);
    var stickyTop = parseFloat(stickyStyle.top) || 0;
    sectionTop = Math.max(window.scrollY, 0) + rect.top;
    scrollRange = Math.max(section.offsetHeight - sticky.offsetHeight - stickyTop, 1);
    measuredWidth = document.documentElement.clientWidth;
  }

  function updateProgress() {
    if (!measuredWidth) measureScrollRange();

    var rect = section.getBoundingClientRect();
    var isActive = rect.bottom > 0 && rect.top < window.innerHeight;
    if (isActive !== heroActive) {
      heroActive = isActive;
      document.body.classList.toggle('field-hero-active', isActive);
    }

    var scrollY = Math.max(window.scrollY, 0);
    var nextProgress = clamp((scrollY - sectionTop) / scrollRange, 0, 1);
    if (scrollY >= lastScrollY - 1) nextProgress = Math.max(targetProgress, nextProgress);
    targetProgress = nextProgress;
    lastScrollY = scrollY;

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
    var lastStableFrame = Math.max(0, effectiveDuration - 0.04);
    var target = clamp(targetProgress * effectiveDuration, 0, lastStableFrame);
    if (Math.abs(video.currentTime - target) > 0.05) {
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

  function refreshMetrics() {
    measuredWidth = 0;
    requestFrame();
  }

  function handleResize() {
    if (document.documentElement.clientWidth !== measuredWidth) refreshMetrics();
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', refreshMetrics);
  window.addEventListener('load', refreshMetrics, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshMetrics);
  requestFrame();
  section.classList.add('is-ready');
}());

// Copyright RZU Informatique
