document.addEventListener('DOMContentLoaded', function () {
  // shrink header on scroll and reveal artist names when in view
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (window.scrollY > 60) document.body.classList.add('scrolled'); else document.body.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  var track = document.querySelector('.moving-track');
  var movingSection = document.querySelector('.moving-section');
  var isPaused = false;

  function setPaused(p) {
    if (!track) return;
    isPaused = !!p;
    track.classList.toggle('paused', isPaused);
  }

  if (movingSection && track) {
    movingSection.addEventListener('pointerup', function (ev) {
      var tag = ev.target.tagName.toLowerCase();
      if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'textarea') return;
      setPaused(!isPaused);
    });
  }

  document.addEventListener('keydown', function (ev) {
    var active = document.activeElement && document.activeElement.tagName;
    if (ev.code === 'Space' && active !== 'INPUT' && active !== 'TEXTAREA' && active !== 'BUTTON') {
      ev.preventDefault();
      setPaused(!isPaused);
    }
    if (ev.key === 'Escape' && document.body.classList.contains('login-active')) {
      closeLogin();
    }
  });

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // Navigation active state handling
  var navLinks = document.querySelectorAll('.nav a');
  var panelLinks = document.querySelectorAll('.nav a[data-panel]');
  function normalizePath(h) {
    if (!h) return '';
    try { var u = new URL(h, window.location.origin); return u.pathname.split('/').pop() || 'index.php'; } catch (e) { return h.split('/').pop(); }
  }
  function applyNavActiveByPath(path) {
    navLinks.forEach(function (a) { a.classList.toggle('active', normalizePath(a.getAttribute('href')) === path); });
  }
  // determine current path and apply active class
  var currentPath = window.location.pathname.split('/').pop() || 'index.php';
  // if localStorage holds a chosen nav (from previous click), prefer that
  var stored = localStorage.getItem('navActive');
  if (stored) applyNavActiveByPath(normalizePath(stored)); else applyNavActiveByPath(currentPath);
  // clicking a nav should persist its href so active state remains after navigation
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      var href = a.getAttribute('href');
      if (!a.hasAttribute('data-panel') && href) localStorage.setItem('navActive', href);
    });
  });

  // When login opens, temporarily highlight home
  var previousActiveHref = null;
  function highlightHomeTemporarily() {
    var homeLink = Array.prototype.find.call(navLinks, function (a) { return normalizePath(a.getAttribute('href')) === 'index.php'; });
    var active = document.querySelector('.navigation a.active');
    previousActiveHref = active ? active.getAttribute('href') : null;
    if (homeLink) {
      applyNavActiveByPath('index.php');
    }
  }
  function restoreNavAfterLogin() {
    if (previousActiveHref) applyNavActiveByPath(normalizePath(previousActiveHref)); else applyNavActiveByPath(currentPath);
  }

  // PANEL: show per-nav content in a panel card (no page navigation)
  var panelCard = document.getElementById('panel-card');
  var panelClose = document.querySelector('.panel-close');
  var currentPanel = null;
  function clearAllNavActive() {
    navLinks.forEach(function (a) { a.classList.remove('active'); });
  }
  function setPanelActive(link) {
    clearAllNavActive();
    if (link) link.classList.add('active');
  }
  function openPanel(name, link) {
    if (!panelCard) return;
    // hide all panel-content, then show the one with matching data-panel
    var contents = panelCard.querySelectorAll('.panel-content');
    contents.forEach(function (el) { el.hidden = true; });
    var target = panelCard.querySelector('.panel-content[data-panel="' + name + '"]');
    if (target) target.hidden = false;
    // add a modifier when opening gallery/canvas so we can enlarge panel styles
    if (name === 'gallery') panelCard.classList.add('panel-gallery'); else panelCard.classList.remove('panel-gallery');
    if (name === 'canvas') panelCard.classList.add('panel-canvas'); else panelCard.classList.remove('panel-canvas');
    panelCard.classList.add('show');
    document.body.classList.add('panel-active');
    panelCard.setAttribute('aria-hidden', 'false');
    currentPanel = name;
    setPanelActive(link || null);
    var first = panelCard.querySelector('.panel-content:not([hidden])'); if (first) first.focus();
  }
  function closePanel() {
    if (!panelCard) return;
    panelCard.classList.remove('show');
    panelCard.classList.remove('panel-gallery');
    panelCard.classList.remove('panel-canvas');
    document.body.classList.remove('panel-active');
    panelCard.setAttribute('aria-hidden', 'true');
    currentPanel = null;
    // restore active nav to stored or current path when panel closes
    if (stored) applyNavActiveByPath(normalizePath(stored)); else applyNavActiveByPath(currentPath);
  }
  if (panelClose) panelClose.addEventListener('click', function (ev) { ev.preventDefault(); closePanel(); });
  // open panel when nav link with data-panel is clicked
  panelLinks.forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var panelName = a.getAttribute('data-panel');
      if (!panelName) return;
      if (panelCard && panelCard.classList.contains('show') && currentPanel === panelName) {
        closePanel();
        return;
      }
      openPanel(panelName, a);
    });
  });
  // open panel when the canvas section is clicked
  var canvasTrigger = document.querySelector('.canvas[data-panel="canvas"]');
  if (canvasTrigger) {
    canvasTrigger.addEventListener('click', function () { openPanel('canvas'); });
    canvasTrigger.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openPanel('canvas'); }
    });
  }

  // Icon popovers (email/phone)
  (function () {
    var pops = document.querySelectorAll('.icon-pop');
    if (!pops.length) return;
    function closeAll() {
      pops.forEach(function (p) { p.classList.remove('show'); p.setAttribute('aria-expanded', 'false'); });
    }
    pops.forEach(function (p) {
      p.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var isOpen = p.classList.contains('show');
        closeAll();
        if (!isOpen) {
          p.classList.add('show');
          p.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.addEventListener('click', function () { closeAll(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeAll(); });
  })();
  // close on ESC also handled earlier; ensure it closes panel too
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closePanel(); });

  // Login/registration handlers removed per request

  // Booking + footer message: mailto links (no backend required)
  (function () {
    var bookingBtn = document.getElementById('booking-submit');
    var bookingForm = document.getElementById('booking-form');
    var bookingStatus = document.getElementById('booking-status');
    var footerBtn = document.getElementById('footer-message-submit');
    var footerMsg = document.getElementById('footer-message');
    var emailTo = 'stephenquins400@gmail.com';

    function openMail(subject, body) {
      var url = 'mailto:' + encodeURIComponent(emailTo) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      window.location.href = url;
    }

    function setBookingStatus(text, kind) {
      if (!bookingStatus) return;
      bookingStatus.textContent = text || '';
      bookingStatus.classList.remove('error', 'success');
      if (kind) bookingStatus.classList.add(kind);
    }

    function submitBooking() {
      if (!bookingForm) return;
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        setBookingStatus('Please fill all required fields.', 'error');
        return;
      }
      var name = bookingForm.querySelector('[name="name"]').value.trim();
      var phone = bookingForm.querySelector('[name="phone"]').value.trim();
      var date = bookingForm.querySelector('[name="date"]').value;
      var idea = bookingForm.querySelector('[name="idea"]').value.trim();
      var subject = 'Tattoo Booking Request';
      var body = [
        'Name: ' + name,
        'Phone/WhatsApp: ' + phone,
        'Preferred date: ' + date,
        'Body part + idea: ' + idea
      ].join('\n');
      setBookingStatus('Opening your email app...', 'success');
      openMail(subject, body);
    }

    if (bookingBtn && bookingForm) {
      bookingBtn.addEventListener('click', submitBooking);
      bookingForm.addEventListener('submit', function (ev) { ev.preventDefault(); submitBooking(); });
    }

    if (footerBtn && footerMsg) {
      footerBtn.addEventListener('click', function () {
        var msg = footerMsg.value.trim();
        if (!msg) return;
        openMail('Website Message', msg);
      });
    }
  })();

  // Canvas MVP: body photo + design upload + simple background removal + drag/scale
  (function () {
    var preview = document.getElementById('canvas-preview');
    var overlay = document.getElementById('tattoo-overlay');
    var bodyPreview = document.getElementById('body-preview');
    var bodyUpload = document.getElementById('body-upload');
    var designUpload = document.getElementById('design-upload');
    var removeBg = document.getElementById('remove-bg');
    var threshold = document.getElementById('bg-threshold');
    var designCanvas = document.getElementById('design-canvas');
    var status = document.getElementById('canvas-status');
    var scale = document.getElementById('tattoo-scale');
    var reset = document.getElementById('reset-tattoo');
    if (!preview || !overlay || !designCanvas) return;

    var state = { x: 0, y: 0, scale: 1 };
    var designImage = null;
    var designOriginal = null;
    var hasBody = false;
    var hasDesign = false;
    var ctx = designCanvas.getContext('2d', { willReadFrequently: true });
    function setStatus(text, kind) {
      if (!status) return;
      status.textContent = text || '';
      status.classList.remove('error', 'success');
      if (kind) status.classList.add(kind);
    }
    function applyTransform() {
      overlay.style.transform =
        'translate(calc(-50% + ' + state.x + 'px), calc(-50% + ' + state.y + 'px)) ' +
        'scale(' + state.scale + ')';
    }
    applyTransform();

    if (bodyUpload && bodyPreview) {
      bodyUpload.addEventListener('change', function () {
        var file = bodyUpload.files && bodyUpload.files[0];
        if (!file) return;
        var url = URL.createObjectURL(file);
        bodyPreview.src = url;
        hasBody = true;
        setStatus('Step 1 done. Now upload your tattoo design.', 'success');
      });
    }

    function drawDesignToCanvas(img) {
      var maxSize = 1200;
      var scaleRatio = Math.min(1, maxSize / Math.max(img.width, img.height));
      var w = Math.max(1, Math.round(img.width * scaleRatio));
      var h = Math.max(1, Math.round(img.height * scaleRatio));
      designCanvas.width = w;
      designCanvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      designOriginal = ctx.getImageData(0, 0, w, h);
    }

    function loadDesignFile(file) {
      var img = new Image();
      img.onload = function () {
        designImage = img;
        drawDesignToCanvas(img);
        overlay.src = designCanvas.toDataURL('image/png');
        hasDesign = true;
        if (!hasBody) {
          setStatus('Please upload a body photo first (Step 1).', 'error');
        } else {
          setStatus('Step 2 done. Remove the background next.', 'success');
        }
      };
      img.src = URL.createObjectURL(file);
    }

    if (designUpload) {
      designUpload.addEventListener('change', function () {
        var file = designUpload.files && designUpload.files[0];
        if (!file) return;
        loadDesignFile(file);
      });
    }

    function removeBackground() {
      if (!hasBody) {
        setStatus('Step 1 required: upload a body photo.', 'error');
        return;
      }
      if (!designOriginal) {
        setStatus('Step 2 required: upload a tattoo design.', 'error');
        return;
      }
      var t = parseInt(threshold && threshold.value ? threshold.value : '30', 10);
      var data = new Uint8ClampedArray(designOriginal.data);
      for (var i = 0; i < data.length; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        if (r > 255 - t && g > 255 - t && b > 255 - t) {
          data[i + 3] = 0;
        }
      }
      var processed = new ImageData(data, designOriginal.width, designOriginal.height);
      ctx.putImageData(processed, 0, 0);
      overlay.src = designCanvas.toDataURL('image/png');
      setStatus('Step 3 done. Drag and scale to position it.', 'success');
    }

    if (removeBg) removeBg.addEventListener('click', removeBackground);

    if (scale) scale.addEventListener('input', function () { state.scale = parseFloat(scale.value); applyTransform(); });
    if (reset) reset.addEventListener('click', function () {
      state = { x: 0, y: 0, scale: 1 };
      if (scale) scale.value = '1';
      applyTransform();
      if (designImage) {
        drawDesignToCanvas(designImage);
        overlay.src = designCanvas.toDataURL('image/png');
      }
      setStatus('', '');
    });

    var dragging = false;
    var startX = 0;
    var startY = 0;
    var baseX = 0;
    var baseY = 0;
    overlay.addEventListener('pointerdown', function (ev) {
      dragging = true;
      overlay.setPointerCapture(ev.pointerId);
      startX = ev.clientX;
      startY = ev.clientY;
      baseX = state.x;
      baseY = state.y;
    });
    overlay.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      state.x = baseX + dx;
      state.y = baseY + dy;
      applyTransform();
    });
    overlay.addEventListener('pointerup', function () { dragging = false; });
    overlay.addEventListener('pointercancel', function () { dragging = false; });
  })();

  // Simple lightbox / fullscreen viewer for gallery items
  (function () {
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    var lbInner = lightbox.querySelector('.lightbox-inner');
    var lbMedia = lightbox.querySelector('.lightbox-media');
    var lbClose = lightbox.querySelector('.lightbox-close');

    function openLightbox(src) {
      lbMedia.innerHTML = '';
      if (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = 'Full view';
        lbMedia.appendChild(img);
      } else {
        var ph = document.createElement('div'); ph.className = 'placeholder-large';
        ph.innerHTML = '<svg class="placeholder-icon" viewBox="0 0 24 24"><path d="M21 19V5a2 2 0 0 0-2-2H5c-1.11 0-2 .9-2 2v14l4-3 3 4 6-6 7 4z"/></svg>';
        lbMedia.appendChild(ph);
      }
      lightbox.classList.add('show');
      lightbox.setAttribute('aria-hidden', 'false');
      lbClose.focus();
    }
    function closeLightbox() {
      lightbox.classList.remove('show');
      lightbox.setAttribute('aria-hidden', 'true');
      lbMedia.innerHTML = '';
    }
    // attach click handlers on gallery items
    document.querySelectorAll('.gallery-item').forEach(function (it) {
      it.addEventListener('click', function (ev) {
        ev.preventDefault();
        var src = it.getAttribute('data-src');
        var img = it.querySelector('img');
        if (img && img.src) src = img.src;
        openLightbox(src);
      });
      it.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); it.click(); } });
    });

    lbClose.addEventListener('click', function (ev) { ev.preventDefault(); closeLightbox(); });
    lightbox.addEventListener('click', function (ev) { if (ev.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeLightbox(); });
  })();

  // Reveal artist names when the artist-row enters viewport
  (function () {
    var rows = document.querySelectorAll('.artist-row');
    if (!rows || !rows.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
        } else {
          e.target.classList.remove('in-view');
        }
      });
    }, { threshold: 0.35 });
    rows.forEach(function (r) { obs.observe(r); });
  })();
});
