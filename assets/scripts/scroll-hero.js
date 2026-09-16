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
  var desiredTime = 0;
  var seekPending = false;
  var videoReady = false;
  var touchStartY = 0;
  var touchStartScrollY = 0;
  var touchGestureStopped = false;
  var wheelGestureStopped = false;
  var wheelReleaseTimer = 0;
  var exitBlockedOnce = false;
  var exitUnlocked = false;

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
    if (scrollY < heroEndScrollY() - 24) {
      exitBlockedOnce = false;
      exitUnlocked = false;
    }
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
    video.loop = false;
    video.pause();
    // Decode and paint the real opening frame immediately. A separate poster
    // would otherwise remain visible until the first scroll-driven seek.
    if (video.currentTime === 0 && effectiveDuration > 0) {
      try {
        video.currentTime = Math.min(0.001, effectiveDuration);
      } catch (e) {
        // The normal scroll renderer will retry once the media can seek.
      }
    }
    updateScene();
  }

  video.addEventListener('loadedmetadata', markReady);
  video.addEventListener('loadeddata', markReady);
  video.addEventListener('canplay', markReady);
  if (video.readyState >= 1) markReady();

  video.addEventListener('seeked', function () {
    seekPending = false;
    updateScene();
  });

  function updateScene() {
    if (!effectiveDuration) return;
    var lastStableFrame = Math.max(0, effectiveDuration - 0.04);
    desiredTime = clamp(targetProgress * effectiveDuration, 0, lastStableFrame);
    if (seekPending || Math.abs(video.currentTime - desiredTime) <= 0.04) return;

    seekPending = true;
    try {
      video.currentTime = desiredTime;
    } catch (e) {
      seekPending = false;
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

  function heroEndScrollY() {
    if (!measuredWidth) measureScrollRange();
    return sectionTop + scrollRange;
  }

  function stopAtHeroEnd(event, requestedScrollY, isTouchGesture) {
    if (exitUnlocked) return false;
    var endScrollY = heroEndScrollY();
    if (requestedScrollY <= endScrollY + 1) return false;
    event.preventDefault();
    if (!isTouchGesture || window.scrollY < endScrollY) {
      window.scrollTo(0, Math.max(window.scrollY, endScrollY));
    }
    exitBlockedOnce = true;
    requestFrame();
    return true;
  }

  section.addEventListener('touchstart', function (event) {
    if (!event.touches.length) return;
    touchStartY = event.touches[0].clientY;
    touchStartScrollY = Math.max(window.scrollY, 0);
    touchGestureStopped = false;
    if (exitBlockedOnce && touchStartScrollY >= heroEndScrollY() - 2) exitUnlocked = true;
  }, { passive: true });

  section.addEventListener('touchmove', function (event) {
    if (!event.touches.length) return;
    var distance = touchStartY - event.touches[0].clientY;
    if (distance <= 0) return;
    if (touchGestureStopped) {
      event.preventDefault();
      return;
    }
    touchGestureStopped = stopAtHeroEnd(event, touchStartScrollY + distance, true);
  }, { passive: false });

  section.addEventListener('wheel', function (event) {
    window.clearTimeout(wheelReleaseTimer);
    wheelReleaseTimer = window.setTimeout(function () {
      wheelGestureStopped = false;
      if (exitBlockedOnce) exitUnlocked = true;
    }, 180);
    if (event.deltaY <= 0) return;
    if (wheelGestureStopped) {
      event.preventDefault();
      return;
    }
    wheelGestureStopped = stopAtHeroEnd(event, Math.max(window.scrollY, 0) + event.deltaY, false);
  }, { passive: false });

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', refreshMetrics);
  window.addEventListener('load', refreshMetrics, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshMetrics);
  requestFrame();
  section.classList.add('is-ready');
}());

// Copyright RZU Informatique
