// Email service — DISABLED for local self-hosted instance.
// This instance uses username+password authentication only.
// All functions are no-ops to preserve compatibility with any remaining call sites.

function sendEmail() { return Promise.resolve({ sent: false, reason: 'disabled' }); }
function isConfigured() { return false; }
function emailConfigStatus() { return { configured: false, transport: 'disabled' }; }
function unsubscribeParts() { return { header: '', footer: '' }; }
function buildSmtpMessage() { return null; }
function buildGraphPayload() { return null; }
function smtpFromAddress() { return ''; }

module.exports = { sendEmail, isConfigured, emailConfigStatus, unsubscribeParts, buildSmtpMessage, buildGraphPayload, smtpFromAddress };
