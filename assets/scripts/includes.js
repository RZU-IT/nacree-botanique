(async function () {
  'use strict';

  var slots = document.querySelectorAll('[data-include]');

  await Promise.all(Array.prototype.map.call(slots, async function (slot) {
    var path = slot.getAttribute('data-include');
    try {
      var response = await fetch(path);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      slot.outerHTML = await response.text();
    } catch (error) {
      console.warn('Impossible de charger le partial ' + path + ': ' + error.message);
      slot.remove();
    }
  }));

  document.dispatchEvent(new Event('includes:ready'));
}());
