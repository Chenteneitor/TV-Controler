// Billing emails — DISABLED for local self-hosted instance.
// No-ops to preserve compatibility with existing call sites.
function sendBillingEmail() {}
module.exports = { sendBillingEmail };
