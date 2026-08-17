(function () {
  'use strict';

  function initSite() {

  var body = document.body;
  var header = document.getElementById('site-header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  var closeButton = document.getElementById('nav-close');
  var backdrop = document.getElementById('nav-backdrop');
  var lastFocusedElement = null;

  function openNav() {
    if (!nav || !toggle || !backdrop) return;
    lastFocusedElement = document.activeElement;
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
    body.classList.add('nav-open');
    requestAnimationFrame(function () {
      backdrop.classList.add('is-visible');
      if (closeButton) closeButton.focus();
    });
  }

  function closeNav(restoreFocus) {
    if (!nav || !toggle || !backdrop) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('is-visible');
    body.classList.remove('nav-open');
    window.setTimeout(function () { backdrop.hidden = true; }, 300);
    if (restoreFocus && lastFocusedElement) lastFocusedElement.focus();
  }

  if (toggle && nav && backdrop) {
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) closeNav(false);
      else openNav();
    });
    if (closeButton) closeButton.addEventListener('click', function () { closeNav(true); });
    backdrop.addEventListener('click', function () { closeNav(true); });
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () { closeNav(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('open')) closeNav(true);
      if (event.key === 'Tab' && nav.classList.contains('open')) {
        var focusable = nav.querySelectorAll('a, button:not([disabled])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  var carousel = document.getElementById('inspiration-carousel');
  if (carousel) {
    var carouselTrack = carousel.querySelector('.inspiration-track');
    var carouselSlides = Array.prototype.slice.call(carousel.querySelectorAll('.inspiration-slide'));
    var carouselDots = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-dots button'));
    var previousButton = carousel.querySelector('.carousel-prev');
    var nextButton = carousel.querySelector('.carousel-next');
    var carouselIndex = 0;
    var carouselTimer = null;
    var touchStartX = 0;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function renderCarousel() {
      carouselSlides.forEach(function (slide, index) {
        var active = index === carouselIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      carouselDots.forEach(function (dot, index) {
        var active = index === carouselIndex;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function showSlide(index) {
      carouselIndex = (index + carouselSlides.length) % carouselSlides.length;
      renderCarousel();
    }

    function stopCarousel() {
      if (carouselTimer) {
        window.clearInterval(carouselTimer);
        carouselTimer = null;
      }
    }

    function startCarousel() {
      stopCarousel();
      if (!reduceMotion) {
        carouselTimer = window.setInterval(function () {
          showSlide(carouselIndex + 1);
        }, 5500);
      }
    }

    if (previousButton) previousButton.addEventListener('click', function () { showSlide(carouselIndex - 1); startCarousel(); });
    if (nextButton) nextButton.addEventListener('click', function () { showSlide(carouselIndex + 1); startCarousel(); });
    carouselDots.forEach(function (dot, index) {
      dot.addEventListener('click', function () { showSlide(index); startCarousel(); });
    });

    carouselTrack.addEventListener('touchstart', function (event) {
      touchStartX = event.changedTouches[0].clientX;
      stopCarousel();
    }, { passive: true });
    carouselTrack.addEventListener('touchend', function (event) {
      var distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 45) showSlide(carouselIndex + (distance < 0 ? 1 : -1));
      startCarousel();
    }, { passive: true });

    carousel.addEventListener('mouseenter', stopCarousel);
    carousel.addEventListener('mouseleave', startCarousel);
    carousel.addEventListener('focusin', stopCarousel);
    carousel.addEventListener('focusout', startCarousel);
    carousel.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        showSlide(carouselIndex - 1);
        startCarousel();
      } else if (event.key === 'ArrowRight') {
        showSlide(carouselIndex + 1);
        startCarousel();
      }
    });

    renderCarousel();
    startCarousel();
  }

  var networkBloom = document.getElementById('network-bloom');
  if (networkBloom) {
    var bloomPetals = Array.prototype.slice.call(networkBloom.querySelectorAll('.bloom-petal'));
    var networkProfiles = Array.prototype.slice.call(networkBloom.querySelectorAll('.network-profile'));
    var networkEmpty = document.getElementById('network-empty');
    var activeNetworkIndex = '';

    function showNetworkProfile(index) {
      var shouldClose = activeNetworkIndex === index;
      activeNetworkIndex = shouldClose ? '' : index;
      networkBloom.classList.toggle('has-selection', !shouldClose);

      bloomPetals.forEach(function (petal) {
        var active = !shouldClose && petal.getAttribute('data-network-index') === index;
        petal.classList.toggle('is-active', active);
        petal.parentElement.classList.toggle('is-active', active);
        petal.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      networkProfiles.forEach(function (profile) {
        var active = !shouldClose && profile.id === 'network-panel-' + index;
        profile.hidden = !active;
        if (active) {
          profile.style.animation = 'none';
          profile.offsetHeight;
          profile.style.animation = '';
        }
      });

      if (networkEmpty) networkEmpty.hidden = !shouldClose;
    }

    bloomPetals.forEach(function (petal, index) {
      petal.addEventListener('click', function () {
        showNetworkProfile(petal.getAttribute('data-network-index'));
      });

      petal.addEventListener('keydown', function (event) {
        var nextIndex = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % bloomPetals.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + bloomPetals.length) % bloomPetals.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = bloomPetals.length - 1;
        else return;

        event.preventDefault();
        bloomPetals[nextIndex].focus();
        showNetworkProfile(bloomPetals[nextIndex].getAttribute('data-network-index'));
      });
    });
  }

  var welcomeVideoSection = document.querySelector('.welcome-video');
  var welcomeVideoMedia = welcomeVideoSection ? welcomeVideoSection.querySelector('.welcome-video-media') : null;
  var welcomeVideoContent = document.querySelector('.welcome-video-content');
  var welcomeVideoSteps = document.querySelectorAll('[data-video-step]');
  var welcomeVideoStage = 0;
  var welcomeVideoFrame = 0;

  function completeWelcomeVideoSequence() {
    if (!welcomeVideoSection || welcomeVideoSection.classList.contains('is-complete')) return;

    var followingSection = welcomeVideoSection.nextElementSibling;
    var followingSectionTop = followingSection ? followingSection.getBoundingClientRect().top : 0;
    if (followingSection) {
      Array.prototype.forEach.call(followingSection.querySelectorAll('.reveal'), function (element) {
        element.classList.add('in-view');
      });
    }

    welcomeVideoSection.classList.add('is-complete');
    if (followingSection) {
      var positionDifference = followingSection.getBoundingClientRect().top - followingSectionTop;
      if (Math.abs(positionDifference) > 1) {
        var previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollBy(0, positionDifference);
        window.requestAnimationFrame(function () {
          document.documentElement.style.scrollBehavior = previousScrollBehavior;
        });
      }
    }
    window.removeEventListener('scroll', requestWelcomeVideoUpdate);
    window.removeEventListener('resize', requestWelcomeVideoUpdate);
  }

  function revealWelcomeVideoStage(nextStage) {
    if (nextStage <= welcomeVideoStage) return;
    welcomeVideoStage = nextStage;

    Array.prototype.forEach.call(welcomeVideoSteps, function (step) {
      if (Number(step.getAttribute('data-video-step')) <= welcomeVideoStage) {
        step.classList.add('is-visible');
      }
    });

  }

  function updateWelcomeVideoSequence() {
    welcomeVideoFrame = 0;
    if (!welcomeVideoSection || !welcomeVideoContent || welcomeVideoSection.classList.contains('is-complete')) return;

    var sectionRect = welcomeVideoSection.getBoundingClientRect();
    var stickyOffset = window.innerWidth <= 900 ? 72 : 82;
    var scrollRange = Math.max(1, welcomeVideoSection.offsetHeight - welcomeVideoContent.offsetHeight);
    var travelled = Math.max(0, stickyOffset - sectionRect.top);
    var progress = Math.min(1, travelled / scrollRange);

    if (progress >= 0.66) revealWelcomeVideoStage(3);
    else if (progress >= 0.3) revealWelcomeVideoStage(2);
    else if (progress >= 0.06) revealWelcomeVideoStage(1);

    var followingSection = welcomeVideoSection.nextElementSibling;
    if (welcomeVideoStage === 3 && followingSection && followingSection.getBoundingClientRect().top <= stickyOffset + 1) {
      completeWelcomeVideoSequence();
    }
  }

  function requestWelcomeVideoUpdate() {
    if (welcomeVideoFrame) return;
    welcomeVideoFrame = window.requestAnimationFrame(updateWelcomeVideoSequence);
  }

  if (welcomeVideoSection && welcomeVideoContent && welcomeVideoSteps.length) {
    window.addEventListener('scroll', requestWelcomeVideoUpdate, { passive: true });
    window.addEventListener('resize', requestWelcomeVideoUpdate);
    requestWelcomeVideoUpdate();
  }

  if (welcomeVideoMedia) {
    if ('IntersectionObserver' in window) {
      var welcomeMediaObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var playback = welcomeVideoMedia.play();
            if (playback && playback.catch) playback.catch(function () {});
          } else {
            welcomeVideoMedia.pause();
          }
        });
      }, { threshold: 0.08 });
      welcomeMediaObserver.observe(welcomeVideoMedia);
    } else {
      var fallbackPlayback = welcomeVideoMedia.play();
      if (fallbackPlayback && fallbackPlayback.catch) fallbackPlayback.catch(function () {});
    }
  }

  var hourCounts = Array.prototype.slice.call(document.querySelectorAll('.hour-count'));
  var hoursSection = hourCounts.length ? hourCounts[0].closest('.visit') : null;
  var motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoursAnimated = false;

  hourCounts.forEach(function (counter) {
    counter.textContent = motionReduced ? counter.getAttribute('data-count') : '0';
  });

  function animateHours() {
    if (hoursAnimated || !hourCounts.length) return;
    hoursAnimated = true;

    if (motionReduced) {
      hourCounts.forEach(function (counter) {
        counter.textContent = counter.getAttribute('data-count');
      });
      return;
    }

    var startTime = null;
    var duration = 3200;

    function updateCounters(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      hourCounts.forEach(function (counter) {
        var target = Number(counter.getAttribute('data-count'));
        counter.textContent = String(Math.round(target * eased));
      });

      if (progress < 1) {
        window.requestAnimationFrame(updateCounters);
      } else {
        hourCounts.forEach(function (counter) {
          counter.textContent = counter.getAttribute('data-count');
        });
      }
    }

    window.requestAnimationFrame(updateCounters);
  }

  if (hoursSection && 'IntersectionObserver' in window) {
    var hoursObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateHours();
          hoursObserver.disconnect();
        }
      });
    }, { threshold: 0.22, rootMargin: '0px 0px -8% 0px' });
    hoursObserver.observe(hoursSection);
  } else if (hoursSection) {
    window.setTimeout(animateHours, 350);
  }

  var petalLayer = document.getElementById('petal-rain');
  var petalColors = [
    '#f0ce47',
    '#f7df7e',
    '#f3d5ca',
    '#f3a6b8',
    '#d79ab5',
    '#e98578',
    '#f6c28b',
    '#c4b5e5',
    '#9fcfd0',
    '#b7d7a8',
    '#dbece8',
    '#ffffff'
  ];

  function createPetal() {
    if (!petalLayer || motionReduced || document.hidden) return;
    var petal = document.createElement('span');
    var duration = 7 + Math.random() * 5;
    var drift = -90 + Math.random() * 180;
    var spin = (Math.random() > 0.5 ? 1 : -1) * (420 + Math.random() * 500);

    petal.className = 'falling-petal';
    petal.style.setProperty('--petal-left', (4 + Math.random() * 92) + 'vw');
    petal.style.setProperty('--petal-size', (8 + Math.random() * 8) + 'px');
    petal.style.setProperty('--petal-duration', duration + 's');
    petal.style.setProperty('--petal-drift', drift + 'px');
    petal.style.setProperty('--petal-spin', spin + 'deg');
    petal.style.setProperty('--petal-color', petalColors[Math.floor(Math.random() * petalColors.length)]);
    petalLayer.appendChild(petal);

    petal.addEventListener('animationend', function () { petal.remove(); });
    window.setTimeout(function () { if (petal.parentNode) petal.remove(); }, (duration + 1) * 1000);
  }

  function schedulePetal() {
    if (!petalLayer || motionReduced) return;
    window.setTimeout(function () {
      createPetal();
      schedulePetal();
    }, 2200 + Math.random() * 3000);
  }

  if (petalLayer && !motionReduced) {
    window.setTimeout(function () {
      createPetal();
      schedulePetal();
    }, 900);
  }

  var departmentList = document.querySelector('.departments-inline');
  if (departmentList) {
    var departmentBubbles = Array.prototype.slice.call(departmentList.querySelectorAll('strong'));
    var burstVectors = [
      [-27, -15, -55],
      [-12, -30, 38],
      [8, -34, 88],
      [25, -21, 145],
      [29, 1, 205],
      [-28, 5, -120]
    ];
    var burstColors = ['#efc7bc', '#f0ce47', '#ffffff', '#cae3dc'];

    departmentBubbles.forEach(function (bubble, bubbleIndex) {
      var burst = document.createElement('span');
      burst.className = 'department-burst';
      burst.setAttribute('aria-hidden', 'true');

      burstVectors.forEach(function (vector, petalIndex) {
        var burstPetal = document.createElement('i');
        var variation = (bubbleIndex % 3) - 1;
        burstPetal.style.setProperty('--burst-x', (vector[0] + variation * 2) + 'px');
        burstPetal.style.setProperty('--burst-y', (vector[1] - (bubbleIndex % 2) * 2) + 'px');
        burstPetal.style.setProperty('--burst-rotate', (vector[2] + bubbleIndex * 17) + 'deg');
        burstPetal.style.setProperty('--petal-delay', (petalIndex * .018) + 's');
        burstPetal.style.setProperty('--petal-color', burstColors[(petalIndex + bubbleIndex) % burstColors.length]);
        burst.appendChild(burstPetal);
      });

      bubble.appendChild(burst);
    });

    function revealDepartmentBubbles() {
      departmentList.classList.add('is-popping');
    }

    if ('IntersectionObserver' in window) {
      var departmentsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealDepartmentBubbles();
            departmentsObserver.disconnect();
          }
        });
      }, { threshold: .45, rootMargin: '0px 0px -6% 0px' });
      departmentsObserver.observe(departmentList);
    } else {
      revealDepartmentBubbles();
    }
  }

  var revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    Array.prototype.forEach.call(revealElements, function (element) { observer.observe(element); });
  } else {
    Array.prototype.forEach.call(revealElements, function (element) { element.classList.add('in-view'); });
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && nav && nav.classList.contains('open')) closeNav(false);
  });
  }

  function startSite() {
    if (document.querySelector('[data-include]')) {
      document.addEventListener('includes:ready', initSite, { once: true });
      return;
    }
    initSite();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSite, { once: true });
  } else {
    startSite();
  }
})();
