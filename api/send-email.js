import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { orgName, contactName, contactEmail, orgProfile, analysis } = req.body;
  if (!orgName || !analysis) return res.status(400).json({ error: 'Missing required fields' });
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'Resend key not configured' });
  const resend = new Resend(resendKey);
  const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;color:#1e2b1e;max-width:700px;margin:0 auto;padding:20px}h1{color:#1a2e1a;border-bottom:2px solid #2d5016;padding-bottom:10px}h2{color:#2d5016;margin-top:30px}.badge{display:inline-block;background:#2d5016;color:white;padding:4px 12px;border-radius:20px;font-size:13px;margin-bottom:20px}.meta{background:#f0f7e8;border-left:3px solid #5a7a3a;padding:12px 16px;margin:16px 0;font-size:14px}.section{background:#fff;border:1px solid #ddd8ce;border-radius:8px;padding:16px;margin:16px 0}.footer{margin-top:30px;padding-top:16px;border-top:1px solid #ddd8ce;font-size:12px;color:#6b7a5e}</style></head><body><div class="badge">BCF Grant Intake</div><h1>New Grant Readiness Submission</h1><div class="meta"><strong>Organization:</strong> ${orgName}<br><strong>Contact:</strong> ${contactName} &mdash; ${contactEmail}<br><strong>Submitted:</strong> ${new Date().toLocaleString()}</div><div class="section"><h2>Intake Profile</h2><pre style="white-space:pre-wrap;font-size:13px;line-height:1.7">${orgProfile}</pre></div><div class="section"><h2>AI Grant Readiness Analysis</h2><div style="white-space:pre-wrap;font-size:14px;line-height:1.8">${analysis.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></div><div class="footer">Sent by BCF Grant Intake System &mdash; <a href="https://www.bcfcenter.org">bcfcenter.org</a></div></body></html>`;
  try {
    const { error } = await resend.emails.send({
      from: 'BCF Grant Intake <onboarding@resend.dev>',
      to: ['businesscultivationfoundation@gmail.com'],
      replyTo: contactEmail || 'noreply@bcfcenter.org',
      subject: `New Grant Intake: ${orgName}`,
      html: htmlBody,
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message || 'Email failed' });
  }
}
