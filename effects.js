/* ============================================================
   effects.js : petits ajouts visuels et d'ergonomie
   - Bouton « œil » pour afficher / masquer les mots de passe
   - Avertissement « Verr. Maj. activée »
   - Halo lumineux qui suit la souris sur les cartes et sur la page
   - Confettis quand la candidature est bien envoyée
   N'a aucun lien avec la base de données : script.js n'est pas modifié.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Bouton œil ---------- */
    function setVisible(btn, input, show) {
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', show ? 'true' : 'false');
        var label = show ? 'Masquer le mot de passe' : 'Afficher le mot de passe';
        btn.setAttribute('aria-label', label);
        btn.title = label;
        var icon = btn.querySelector('i');
        if (icon) icon.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        btn.classList.remove('pop');
        void btn.offsetWidth; // relance l'animation
        btn.classList.add('pop');
    }

    var toggles = [];
    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
        var input = document.getElementById(btn.getAttribute('data-toggle-password'));
        if (!input) return;
        toggles.push({ btn: btn, input: input });

        btn.addEventListener('click', function () {
            var show = input.type === 'password';
            setVisible(btn, input, show);
            input.focus({ preventScroll: true });
            // curseur à la fin du texte
            try { var n = input.value.length; input.setSelectionRange(n, n); } catch (e) {}
        });
    });

    function hideAll() {
        toggles.forEach(function (t) {
            if (t.input.type !== 'password') setVisible(t.btn, t.input, false);
        });
    }

    // Remet « masqué » quand un formulaire est vidé (changement de compte, déconnexion…)
    ['authForm', 'adminLoginForm'].forEach(function (id) {
        var f = document.getElementById(id);
        if (f) f.addEventListener('reset', function () { setTimeout(hideAll, 0); });
    });
    // Et à chaque ouverture / fermeture de la fenêtre admin
    ['headerAdminBtn', 'cancelAdminBtn', 'adminModalOverlay'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', hideAll);
    });
    var adminForm = document.getElementById('adminLoginForm');
    if (adminForm) adminForm.addEventListener('submit', function () { setTimeout(hideAll, 0); });

    /* ---------- Verr. Maj. ---------- */
    var pwd = document.getElementById('authPassword');
    var caps = document.getElementById('capsHint');
    if (pwd && caps) {
        var check = function (e) {
            if (!e.getModifierState) return;
            caps.classList.toggle('hidden', !e.getModifierState('CapsLock'));
        };
        pwd.addEventListener('keydown', check);
        pwd.addEventListener('keyup', check);
        pwd.addEventListener('blur', function () { caps.classList.add('hidden'); });
    }


    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Halo doux qui suit la souris sur toute la page ---------- */
    if (!reduced && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var aura = document.createElement('div');
        aura.className = 'cursor-aura';
        aura.setAttribute('aria-hidden', 'true');
        document.body.appendChild(aura);
        var ax = window.innerWidth / 2, ay = window.innerHeight / 3, tx = ax, ty = ay;
        document.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
        (function loop() {
            ax += (tx - ax) * 0.08; ay += (ty - ay) * 0.08;
            aura.style.transform = 'translate3d(' + ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px,0)';
            requestAnimationFrame(loop);
        })();
    }

    /* ---------- Confettis à l'envoi de la candidature ---------- */
    function confetti() {
        if (reduced) return;
        var cv = document.createElement('canvas');
        cv.setAttribute('aria-hidden', 'true');
        cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W = cv.width = window.innerWidth * dpr, H = cv.height = window.innerHeight * dpr;
        document.body.appendChild(cv);
        var ctx = cv.getContext('2d');
        var colors = ['#818cf8', '#a78bfa', '#f472b6', '#c4b5fd', '#f9a8d4', '#ffffff'];
        var parts = [];
        for (var i = 0; i < 90; i++) {
            var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.5, sp = (7 + Math.random() * 9) * dpr;
            parts.push({
                x: W / 2, y: H * 0.38, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
                w: (5 + Math.random() * 6) * dpr, h: (3 + Math.random() * 4) * dpr,
                r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
                c: colors[(Math.random() * colors.length) | 0]
            });
        }
        var start = performance.now(), DURATION = 2200;
        (function frame(now) {
            var t = now - start;
            ctx.clearRect(0, 0, W, H);
            ctx.globalAlpha = Math.max(0, 1 - t / DURATION);
            parts.forEach(function (p) {
                p.vy += 0.28 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
                ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
            });
            if (t < DURATION) requestAnimationFrame(frame); else cv.remove();
        })(start);
    }
    var okModal = document.getElementById('successModal');
    if (okModal && window.MutationObserver) {
        var wasHidden = okModal.classList.contains('hidden');
        new MutationObserver(function () {
            var hidden = okModal.classList.contains('hidden');
            if (wasHidden && !hidden) {
                // uniquement si la candidature est bien enregistrée (icône « check »)
                setTimeout(function () {
                    var ic = document.getElementById('modalIconI');
                    if (ic && ic.classList.contains('fa-check')) confetti();
                }, 250);
            }
            wasHidden = hidden;
        }).observe(okModal, { attributes: true, attributeFilter: ['class'] });
    }

    /* ---------- Halo qui suit la souris sur les cartes ---------- */
    document.addEventListener('pointermove', function (e) {
        var t = e.target;
        var card = t && t.closest ? t.closest('.card-main') : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
})();
