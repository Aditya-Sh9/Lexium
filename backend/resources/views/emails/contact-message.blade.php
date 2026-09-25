<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New contact message — Lexium</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: #0f1b2d; padding: 24px 32px; }
    .header p { color: #c8a84e; font-size: 12px; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
    .header h1 { color: #ffffff; font-family: Georgia, serif; font-size: 22px; font-weight: normal; margin: 6px 0 0; }
    .body { padding: 28px 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { padding: 8px 0; vertical-align: top; border-bottom: 1px solid #f1f1f1; }
    td.k { width: 110px; color: #6b7280; }
    td.v { color: #111827; }
    .message { margin-top: 20px; padding: 16px 18px; background: #faf8f5; border: 1px solid #e8e2d8; border-radius: 6px; color: #2a231a; font-size: 15px; line-height: 1.6; white-space: pre-wrap; }
    .footer { padding: 16px 32px 24px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p>Contact form · {{ $contact->reference }}</p>
      <h1>{{ $contact->topic }}</h1>
    </div>
    <div class="body">
      <table>
        <tr><td class="k">From</td><td class="v">{{ $contact->name }}</td></tr>
        <tr><td class="k">Email</td><td class="v"><a href="mailto:{{ $contact->email }}">{{ $contact->email }}</a></td></tr>
        <tr><td class="k">Received</td><td class="v">{{ $contact->created_at?->timezone(config('app.timezone'))->format('j M Y, g:i A') }}</td></tr>
      </table>
      <div class="message">{{ $contact->message }}</div>
    </div>
    <div class="footer">Reply to this email to respond directly to {{ $contact->name }}.</div>
  </div>
</body>
</html>
