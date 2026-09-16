(function () {
  'use strict';

  var section = document.querySelector('.welcome-video');
  if (!section) return;

  var media = section.querySelector('.welcome-video-media');
  var sticky = section.querySelector('.welcome-video-sticky');
  var content = section.querySelector('.welcome-video-content');
  var steps = section.querySelectorAll('[data-video-step]');
  if (!content || !steps.length) return;

  var compactViewport = window.matchMedia('(max-width: 680px)').matches;
  var stage = 0;
  var frame = 0;
  var touchStartY = 0;
  var touchStartScrollY = 0;
  var touchStop = null;

  function stickyOffset() {
    return window.innerWidth <= 900 ? 72 : 82;
  }

  function scrollRange() {
    return Math.max(1, section.offsetHeight - content.offsetHeight);
  }

  function revealStage(nextStage) {
    if (nextStage <= stage) return;
    stage = nextStage;
    Array.prototype.forEach.call(steps, function (step) {
      if (Number(step.getAttribute('data-video-step')) <= stage) step.classList.add('is-visible');
    });
  }

  function completeSequence() {
    if (section.classList.contains('is-complete')) return;

    var rect = section.getBoundingClientRect();
    var sectionTop = Math.max(0, window.scrollY + rect.top);
    var completedHeight = sticky ? sticky.offsetHeight : content.offsetHeight;
    var previousScrollBehavior = document.documentElement.style.scrollBehavior;

    section.classList.add('is-complete');
    section.style.height = completedHeight + 'px';
    section.style.minHeight = completedHeight + 'px';

    // Remove the already-consumed animation distance without moving the
    // picture on screen. From this point both directions use normal scrolling.
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, sectionTop - stickyOffset()));
    window.requestAnimationFrame(function () {
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    });

    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
  }

  function update() {
    frame = 0;
    if (section.classList.contains('is-complete')) return;

    var rect = section.getBoundingClientRect();
    var offset = stickyOffset();
    var progress = Math.min(1, Math.max(0, (offset - rect.top) / scrollRange()));

    if (compactViewport) {
      if (progress >= .66) {
        revealStage(3);
        completeSequence();
      }
      else if (progress >= .33) revealStage(2);
    } else {
      if (progress >= .66) {
        revealStage(3);
        completeSequence();
      }
      else if (progress >= .3) revealStage(2);
      else if (progress >= .06) revealStage(1);
    }
  }

  function requestUpdate() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  if (compactViewport) {
    section.addEventListener('touchstart', function (event) {
      if (!event.touches.length || section.classList.contains('is-complete')) return;
      var rect = section.getBoundingClientRect();
      var range = scrollRange();
      var travelled = Math.max(0, stickyOffset() - rect.top);
      var progress = Math.min(1, travelled / range);
      var nextProgress = [.33, .66, 1].find(function (point) { return point > progress + .025; });

      touchStartY = event.touches[0].clientY;
      touchStartScrollY = Math.max(window.scrollY, 0);
      touchStop = typeof nextProgress === 'number'
        ? touchStartScrollY + (nextProgress * range - travelled)
        : null;
    }, { passive: true });

    section.addEventListener('touchmove', function (event) {
      if (!event.touches.length || touchStop === null) return;
      var distance = touchStartY - event.touches[0].clientY;
      if (distance <= 0 || touchStartScrollY + distance <= touchStop + 1) return;
      event.preventDefault();
      if (window.scrollY < touchStop) window.scrollTo(0, touchStop);
      requestUpdate();
    }, { passive: false });

    section.addEventListener('touchend', function () {
      touchStop = null;
    }, { passive: true });
  }

  if (media) {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var playback = media.play();
            if (playback && playback.catch) playback.catch(function () {});
          } else {
            media.pause();
          }
        });
      }, { threshold: .08 });
      observer.observe(media);
    } else {
      var fallbackPlayback = media.play();
      if (fallbackPlayback && fallbackPlayback.catch) fallbackPlayback.catch(function () {});
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
})();

// Copyright RZU Informatique
