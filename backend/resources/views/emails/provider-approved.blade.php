<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Approved — Lexium</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: Georgia, 'Times New Roman', serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0f1b2d; padding: 40px 48px; }
    .header h1 { color: #c8a84e; font-size: 22px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 40px 48px; }
    .body h2 { color: #0f1b2d; font-size: 24px; margin-top: 0; }
    .body p { color: #4b5563; line-height: 1.7; font-size: 15px; }
    .badge { display: inline-block; background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; }
    .cta { display: inline-block; background: #0f1b2d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-top: 24px; }
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
      <div class="badge">Application Approved</div>
      <h2>Welcome to the Registry, {{ $providerName }}.</h2>
      <p>
        We are pleased to inform you that your application to join the Lexium provider network has been
        <strong>approved</strong>. Your profile is now live on the platform and visible to citizens seeking legal services.
      </p>
      <p>
        You may now log in to your provider dashboard to manage your docket, track your eminence score,
        and begin accepting client petitions and appointments.
      </p>
      <p>
        Should you have any questions, please contact us through the platform's Help section.
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
