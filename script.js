// HETC Front Page Generator Controller
const frame = document.getElementById('page-frame');

// Default layout margins
let currentLayout = {
  pageStyle: {
    marginLeft: "15mm",
    marginRight: "15mm",
    marginTop: "15mm",
    marginBottom: "15mm"
  }
};

let currentFontSize = 4.5; // mm

function getPageWindow() {
  return frame ? frame.contentWindow : null;
}

function initApp() {
  restoreState();
  fitPageFrame();
  setupTwoWaySync();
  setupFontSize();
  setupAutoAdvance();
}

// Ensure init runs whether iframe is loading or already loaded
frame.addEventListener('load', initApp);
if (frame.contentDocument && (frame.contentDocument.readyState === 'complete' || frame.contentDocument.readyState === 'interactive')) {
  setTimeout(initApp, 50);
}

function restoreState() {
  syncMarginsUI();
  applyToPage();
}

function applyToPage() {
  const pw = getPageWindow();
  if (currentLayout && pw && typeof pw.applyLayout === 'function') {
    pw.applyLayout(currentLayout);
  }
}

function syncMarginsUI() {
  const ml = document.getElementById('margin-left');
  const mr = document.getElementById('margin-right');
  const mt = document.getElementById('margin-top');
  const mb = document.getElementById('margin-bottom');

  if (ml) ml.value = parseInt(currentLayout.pageStyle.marginLeft, 10);
  if (mr) mr.value = parseInt(currentLayout.pageStyle.marginRight, 10);
  if (mt) mt.value = parseInt(currentLayout.pageStyle.marginTop, 10);
  if (mb) mb.value = parseInt(currentLayout.pageStyle.marginBottom, 10);
}

// Margin Controls
['left', 'right', 'top', 'bottom'].forEach(side => {
  const el = document.getElementById('margin-' + side);
  if (el) {
    el.addEventListener('input', e => {
      const key = 'margin' + side.charAt(0).toUpperCase() + side.slice(1);
      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
      currentLayout.pageStyle[key] = val + 'mm';
      applyToPage();
    });
  }
});

// Font Size Controls (in mm)
document.querySelectorAll('.btn-fs').forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = parseFloat(btn.dataset.dir);
    currentFontSize = Math.max(2, Math.min(8, Math.round((currentFontSize + dir) * 10) / 10));
    const fsEl = document.getElementById('fs-inputs');
    if (fsEl) fsEl.textContent = currentFontSize;
    setupFontSize();
  });
});

function setupFontSize() {
  const pw = getPageWindow();
  if (pw && pw.document) {
    const inputs = pw.document.querySelectorAll('.blue-input');
    inputs.forEach(input => {
      input.style.fontSize = currentFontSize + 'mm';
    });
  }
}

// Two-Way Data Binding for Details Section
function setupTwoWaySync() {
  const pw = getPageWindow();
  if (!pw || !pw.document) return;

  // Text inputs
  const sideInputs = document.querySelectorAll('.side-input');
  sideInputs.forEach(sideInput => {
    const targetId = sideInput.dataset.target;
    const pageInput = pw.document.getElementById(targetId);

    if (pageInput) {
      // Sync initial value: side wins if filled, else take from page
      if (sideInput.value) {
        pageInput.value = sideInput.value;
      } else if (pageInput.value) {
        sideInput.value = pageInput.value;
      }

      // Side -> Page
      sideInput.addEventListener('input', () => {
        pageInput.value = sideInput.value;
      });

      // Page -> Side
      pageInput.addEventListener('input', () => {
        sideInput.value = pageInput.value;
      });
    }
  });

  // Checkboxes
  const sideCheckboxes = document.querySelectorAll('.side-checkbox');
  sideCheckboxes.forEach(sideCheck => {
    const targetId = sideCheck.dataset.target;
    const pageCheck = pw.document.getElementById(targetId);

    if (pageCheck) {
      if (sideCheck.checked) {
        pageCheck.checked = sideCheck.checked;
      } else if (pageCheck.checked) {
        sideCheck.checked = pageCheck.checked;
      }

      // Side -> Page
      sideCheck.addEventListener('change', () => {
        pageCheck.checked = sideCheck.checked;
      });

      // Page -> Side
      pageCheck.addEventListener('change', () => {
        sideCheck.checked = pageCheck.checked;
      });
    }
  });
}

// Auto Move to Next Line on Overflow (Preview & Side Panel)
function setupAutoAdvance() {
  const pw = getPageWindow();
  if (!pw || !pw.document) return;

  const bindGroup = (ids) => {
    ids.forEach((id, index) => {
      const el = pw.document.getElementById(id);
      if (!el) return;

      el.addEventListener('input', () => {
        // If content overflows the visible line width
        if (el.scrollWidth > el.clientWidth && index < ids.length - 1) {
          const nextEl = pw.document.getElementById(ids[index + 1]);
          if (nextEl) {
            const lastChar = el.value.slice(-1);
            el.value = el.value.slice(0, -1);
            nextEl.value = lastChar + nextEl.value;
            nextEl.focus();
            nextEl.setSelectionRange(1, 1);

            // Trigger sync
            el.dispatchEvent(new Event('input', { bubbles: true }));
            nextEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });

      el.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && el.value === '' && index > 0) {
          const prevEl = pw.document.getElementById(ids[index - 1]);
          if (prevEl) {
            e.preventDefault();
            prevEl.focus();
            const len = prevEl.value.length;
            prevEl.setSelectionRange(len, len);
          }
        }
      });
    });
  };

  bindGroup(['title-input-1', 'title-input-2']);
  bindGroup(['learning-input-1', 'learning-input-2', 'learning-input-3']);
}

// Responsive Fit Page Frame
function fitPageFrame() {
  const pane    = document.querySelector('.page-pane');
  const wrap    = document.querySelector('.page-frame-wrap');
  const frameEl = document.getElementById('page-frame');
  if (!pane || !wrap || !frameEl) return;

  const frameW  = 794;
  const frameH  = 1123;
  const toolbar = document.querySelector('.preview-toolbar');
  const toolH   = toolbar ? toolbar.offsetHeight + 16 : 40;

  const availW  = Math.max(280, pane.clientWidth  - 36);
  const availH  = Math.max(380, pane.clientHeight - toolH - 30);
  const scale   = Math.min(availW / frameW, availH / frameH);

  frameEl.style.transform       = `scale(${scale})`;
  frameEl.style.transformOrigin = 'top left';
  wrap.style.width              = Math.round(frameW * scale) + 'px';
  wrap.style.height             = Math.round(frameH * scale) + 'px';
  frameEl.style.visibility      = 'visible';
}

window.addEventListener('resize', fitPageFrame);
window.addEventListener('orientationchange', fitPageFrame);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    restoreState();
  }
});

// Export as PDF
const downloadBtn = document.getElementById('download-pdf');
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('pdf-filename');
    const name = nameInput ? nameInput.value.trim() : '';
    const pw   = getPageWindow();
    if (!pw) return;

    const prevTitle = document.title;
    if (name) {
      document.title = name;
    } else {
      document.title = "HETC_Front_Page";
    }

    const showStarPopup = () => {
      document.title = prevTitle;
      setTimeout(() => restoreState(), 100);
      const starPopup = document.getElementById('star-popup');
      if (starPopup) starPopup.classList.add('visible');
    };

    pw.addEventListener('afterprint', showStarPopup, { once: true });
    window.addEventListener('afterprint', showStarPopup, { once: true });

    pw.print();
  });
}

// Star Popup Controls
const starPopupClose = document.getElementById('star-popup-close');
if (starPopupClose) {
  starPopupClose.addEventListener('click', () => {
    const p = document.getElementById('star-popup');
    if (p) p.classList.remove('visible');
  });
}

const starPopup = document.getElementById('star-popup');
if (starPopup) {
  starPopup.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('visible');
    }
  });
}
