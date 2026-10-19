/* ============================================================
   effects.js : petits ajouts visuels et d'ergonomie
   - Bouton « œil » pour afficher / masquer les mots de passe
   - Avertissement « Verr. Maj. activée »
   - Halo lumineux qui suit la souris sur les cartes
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

    /* ---------- Halo qui suit la souris ---------- */
    document.addEventListener('pointermove', function (e) {
        var t = e.target;
        var card = t && t.closest ? t.closest('.card-main') : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
})();
