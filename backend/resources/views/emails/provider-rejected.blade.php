<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update — Lexium</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: Georgia, 'Times New Roman', serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0f1b2d; padding: 40px 48px; }
    .header h1 { color: #c8a84e; font-size: 22px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 40px 48px; }
    .body h2 { color: #0f1b2d; font-size: 24px; margin-top: 0; }
    .body p { color: #4b5563; line-height: 1.7; font-size: 15px; }
    .badge { display: inline-block; background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; }
    .reason-box { background: #fef9f0; border-left: 4px solid #c8a84e; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
    .reason-box p { margin: 0; color: #374151; font-style: italic; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 48px; text-align: center; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Lexium Legal Platform</h1>
    </div>
    <div class="body">
      <div class="badge">Application Not Approved</div>
      <h2>Dear {{ $providerName }},</h2>
      <p>
        Thank you for your interest in joining the Lexium provider network. After careful review,
        we are unable to approve your application at this time.
      </p>
      <p><strong>Reason provided by the review team:</strong></p>
      <div class="reason-box">
        <p>{{ $reason }}</p>
      </div>
      <p>
        If you believe this decision was made in error, or if you have additional documentation to
        support your application, you are welcome to re-apply once the issues noted above have been resolved.
      </p>
      <p>
        We appreciate your understanding and hope to welcome you to the registry in the future.
      </p>
      <p style="margin-top: 32px; color: #0f1b2d; font-weight: bold;">
        The Lexium Registry Team
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from Lexium. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
