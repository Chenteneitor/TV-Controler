// Signup emails — DISABLED for local self-hosted instance.
// No-ops to preserve compatibility with existing call sites.
function sendSignupEmails() {}
function sendVerificationEmail() {}
function sendPasswordResetEmail() {}
module.exports = { sendSignupEmails, sendVerificationEmail, sendPasswordResetEmail };
