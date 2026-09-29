import { showToast } from '../components/toast.js';
import { t } from '../i18n.js';
import { esc } from '../utils.js';

const PROVIDER_ICONS = {
  google: `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>`,
  microsoft: `<svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>`,
};

const GENERIC_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>`;

const providerIcon = (slug) => PROVIDER_ICONS[slug] || GENERIC_ICON;

let authConfig = null;

async function loadAuthConfig() {
  if (authConfig) return authConfig;
  const res = await fetch('/api/auth/config');
  authConfig = await res.json();
  return authConfig;
}

async function loadLoginBranding() {
  try {
    const res = await fetch('/api/branding?domain=' + encodeURIComponent(location.hostname));
    if (!res.ok) return {};
    return await res.json();
  } catch { return {}; }
}

function brandEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function applyLoginBrandingDoc(b) {
  const root = document.documentElement;
  if (b.primary_color) root.style.setProperty('--accent', b.primary_color);
  if (b.bg_color) root.style.setProperty('--bg-primary', b.bg_color);
  if (b.brand_name) document.title = b.brand_name;
  if (b.favicon_url) {
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(l => l.setAttribute('href', b.favicon_url));
  }
  if (b.custom_css) {
    let style = document.getElementById('wl-custom-css');
    if (!style) { style = document.createElement('style'); style.id = 'wl-custom-css'; document.head.appendChild(style); }
    style.textContent = b.custom_css;
  }
}

export async function render(container) {
  const [config, branding] = await Promise.all([loadAuthConfig(), loadLoginBranding()]);
  const isSetup = config.needsSetup;
  const canRegister = config.registration_enabled !== false;

  applyLoginBrandingDoc(branding);
  const brandName = branding.brand_name || 'ScreenTinker';
  const logoHtml = branding.logo_url
    ? `<img src="${brandEsc(branding.logo_url)}" alt="${brandEsc(brandName)}" style="max-height:48px;max-width:200px;margin:0 auto 12px;display:block">`
    : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="margin:0 auto 12px">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>`;

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px">
      <div style="width:400px;max-width:100%">
        <div style="text-align:center;margin-bottom:32px">
          ${logoHtml}
          <h1 style="font-size:24px;font-weight:700;color:var(--accent)">${brandEsc(brandName)}</h1>
          <p style="color:var(--text-secondary);font-size:13px;margin-top:4px">
            ${isSetup ? t('auth.subtitle_setup') : t('auth.subtitle_signin')}
          </p>
        </div>

        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px">
          <!-- Local Auth Form -->
          <div id="localAuthForm">
            <div class="form-group">
              <label>Usuario</label>
              <input type="text" id="loginUsername" class="input" placeholder="nombre de usuario" autocomplete="username">
            </div>
            <div class="form-group">
              <label for="loginPassword">${t('auth.password')}</label>
              <input type="password" id="loginPassword" class="input" placeholder="${t('auth.placeholder_password')}" autocomplete="current-password">
            </div>
            ${isSetup ? `
            <div class="form-group">
              <label>${t('auth.name')}</label>
              <input type="text" id="loginName" class="input" placeholder="${t('auth.placeholder_name')}">
            </div>
            ` : ''}
            <button class="btn btn-primary" id="loginBtn" style="width:100%;justify-content:center;padding:10px">
              ${isSetup ? t('auth.create_admin_account') : t('auth.sign_in')}
            </button>
            ${!isSetup && canRegister ? `
            <button class="btn btn-secondary" id="showRegisterBtn" style="width:100%;justify-content:center;padding:10px;margin-top:8px">
              ${t('auth.create_account')}
            </button>
            ` : ''}
          </div>

          <!-- Register form (hidden by default) -->
          <div id="registerForm" style="display:none">
            <div class="form-group">
              <label>Usuario</label>
              <input type="text" id="regUsername" class="input" placeholder="nombre de usuario (3-32 caracteres)">
            </div>
            <div class="form-group">
              <label>${t('auth.name')}</label>
              <input type="text" id="regName" class="input" placeholder="${t('auth.placeholder_name')}">
            </div>
            <div class="form-group">
              <label>${t('auth.password')}</label>
              <input type="password" id="regPassword" class="input" placeholder="${t('auth.placeholder_register_password')}">
            </div>
            <button class="btn btn-primary" id="registerBtn" style="width:100%;justify-content:center;padding:10px">
              ${t('auth.create_account')}
            </button>
            <button class="btn btn-secondary" id="showLoginBtn" style="width:100%;justify-content:center;padding:10px;margin-top:8px">
              ${t('auth.back_to_signin')}
            </button>
          </div>

          <!-- TOTP 2FA challenge (hidden until /login returns mfa_required) -->
          <div id="mfaForm" style="display:none">
            <h2 style="font-size:16px;font-weight:600;margin-bottom:6px">${t('auth.mfa_title')}</h2>
            <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px">${t('auth.mfa_prompt')}</p>
            <div class="form-group">
              <label>${t('auth.mfa_code_label')}</label>
              <input type="text" id="mfaCode" class="input" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false"
                     placeholder="123456" maxlength="40" style="letter-spacing:6px;text-align:center;font-family:monospace;font-size:18px">
            </div>
            <button class="btn btn-primary" id="mfaVerifyBtn" style="width:100%;justify-content:center;padding:10px">${t('auth.mfa_verify')}</button>
            <button class="btn btn-secondary" id="mfaBackBtn" style="width:100%;justify-content:center;padding:10px;margin-top:8px">${t('auth.back_to_signin')}</button>
            <p style="color:var(--text-muted);font-size:11px;text-align:center;margin-top:12px">${t('auth.mfa_recovery_hint')}</p>
          </div>
        </div>

        <!-- Support Access (collapsible) -->
        <details id="supportDetails" style="margin-top:16px">
          <summary style="font-size:11px;color:var(--text-muted);cursor:pointer;text-align:center">${t('auth.support_access')}</summary>
          <div style="margin-top:8px">
            <input type="text" id="supportToken" class="input" placeholder="${t('auth.support_token_placeholder')}" style="font-family:monospace">
            <button class="btn btn-secondary" id="supportLoginBtn" style="width:100%;justify-content:center;padding:8px;margin-top:6px;font-size:12px">${t('auth.support_authenticate')}</button>
          </div>
        </details>

        <p id="loginError" style="color:var(--danger);font-size:12px;text-align:center;margin-top:12px;display:none"></p>
      </div>
    </div>
  `;

  setupHandlers(config, isSetup);
}

function setupHandlers(config, isSetup) {
  const showError = (msg) => {
    const el = document.getElementById('loginError');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  };

  // Support token login
  document.getElementById('supportLoginBtn')?.addEventListener('click', async () => {
    const token = document.getElementById('supportToken')?.value.trim();
    if (!token) { showError(t('auth.error_paste_support_token')); return; }
    try {
      const res = await fetch('/api/auth/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error); return; }
      onAuthSuccess(data);
    } catch (err) { showError(t('auth.error_support_failed')); }
  });

  if (isSetup) {
    document.getElementById('loginBtn')?.addEventListener('click', () => doRegister(true));
    document.getElementById('loginUsername')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRegister(true); });
    document.getElementById('loginPassword')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRegister(true); });
  } else {
    document.getElementById('loginBtn')?.addEventListener('click', () => doLogin());
    document.getElementById('loginUsername')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('loginPassword')?.focus(); });
    document.getElementById('loginPassword')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
      document.getElementById('localAuthForm').style.display = 'none';
      document.getElementById('registerForm').style.display = 'block';
    });
    document.getElementById('showLoginBtn')?.addEventListener('click', () => {
      document.getElementById('localAuthForm').style.display = 'block';
      document.getElementById('registerForm').style.display = 'none';
    });
    document.getElementById('registerBtn')?.addEventListener('click', () => doRegister(false));
    document.getElementById('regPassword')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRegister(false); });
  }

  async function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { showError('Usuario y contraseña requeridos'); return; }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error); return; }
      if (data.mfa_required) { showMfaChallenge(data.mfa_token); return; }
      onAuthSuccess(data);
    } catch (err) {
      showError(t('auth.error_login_failed'));
    }
  }

  function showMfaChallenge(mfaToken) {
    ['localAuthForm', 'registerForm', 'supportDetails'].forEach((id) => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    const form = document.getElementById('mfaForm');
    if (form) form.style.display = 'block';
    const errEl = document.getElementById('loginError'); if (errEl) errEl.style.display = 'none';
    const codeEl = document.getElementById('mfaCode');
    if (codeEl) {
      codeEl.value = '';
      codeEl.focus();
    }

    const verify = async () => {
      const code = codeEl ? codeEl.value.trim() : '';
      if (!code) { showError(t('auth.mfa_code_required')); return; }
      try {
        const res = await fetch('/api/auth/totp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mfa_token: mfaToken, code })
        });
        const data = await res.json();
        if (!res.ok) { showError(data.error || t('auth.mfa_invalid')); if (codeEl) codeEl.select(); return; }
        onAuthSuccess(data);
      } catch (err) {
        showError(t('auth.error_login_failed'));
      }
    };
    document.getElementById('mfaVerifyBtn')?.addEventListener('click', verify);
    codeEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });
    document.getElementById('mfaBackBtn')?.addEventListener('click', () => { window.location.reload(); });
  }

  async function doRegister(isFirstUser) {
    const username = document.getElementById(isFirstUser ? 'loginUsername' : 'regUsername').value.trim();
    const password = document.getElementById(isFirstUser ? 'loginPassword' : 'regPassword').value;
    const name = document.getElementById(isFirstUser ? 'loginName' : 'regName')?.value.trim() || '';
    if (!username || !password) { showError('Usuario y contraseña requeridos'); return; }
    if (password.length < 8) { showError('La contraseña debe tener al menos 8 caracteres'); return; }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error); return; }
      onAuthSuccess(data);
    } catch (err) {
      showError(t('auth.error_registration_failed'));
    }
  }

  // SSO callback handling (for any configured OIDC providers)
  const ssoParams = new URLSearchParams((window.location.hash.split('?')[1] || ''));
  const ssoReturning = ssoParams.get('sso') === '1';
  const ssoError = ssoParams.get('sso_error');

  if (ssoReturning || ssoError) {
    history.replaceState(null, '', window.location.pathname + window.location.search + '#/login');
  }

  if (ssoReturning) {
    (async () => {
      try {
        const res = await fetch('/api/auth/sso/claim', { method: 'POST' });
        if (!res.ok) throw new Error('claim rejected');
        const data = await res.json();
        onAuthSuccess(data);
      } catch {
        showToast(t('auth.sso_failed'), 'error');
      }
    })();
  } else if (ssoError) {
    const known = ['expired', 'bad_state', 'no_code', 'no_email', 'email_unverified',
      'verification_failed', 'provider_refused', 'provider_unavailable', 'unknown_provider',
      'registration_disabled', 'account_exists_local', 'subject_mismatch', 'server_error',
      'domain_not_allowed', 'account_exists_other_provider', 'sso_required'];
    const key = known.includes(ssoError) ? `auth.sso_err_${ssoError}` : 'auth.sso_failed';
    showToast(t(key), 'error');
  }
}

function onAuthSuccess(data) {
  if (!data || !data.token) return;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.hash = '#/';
  window.location.reload();
}

export function cleanup() {}
