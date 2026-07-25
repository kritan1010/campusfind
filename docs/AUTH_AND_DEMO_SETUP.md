# Auth and demo setup

The hosted Supabase email service allows only two emails per hour on its default sender. Configure custom SMTP (for example Resend) before a public demo.

In Supabase Dashboard → Authentication:

1. Disable **Confirm email** for the passwordless demo flow.
2. Set **Site URL** to `https://campus-find-main.vercel.app` and add `https://campus-find-main.vercel.app/login/verify` under Redirect URLs. Do not use `localhost` for production.
3. In **Email Templates → Magic Link**, paste [`supabase/templates/magic_link.html`](../supabase/templates/magic_link.html). It uses `{{ .Token }}`, which sends the six-digit code the app requests.
4. Configure custom SMTP. The template alone does not lift the free default sender rate limit.

Create the hosted demo and admin users without sending email:

```bash
SUPABASE_URL='https://YOUR_PROJECT.supabase.co' \
SUPABASE_SERVICE_ROLE_KEY='YOUR_SERVICE_ROLE_KEY' \
DEMO_USER_PASSWORD='choose-a-strong-demo-password' \
ADMIN_USER_PASSWORD='choose-a-different-strong-admin-password' \
node scripts/create-demo-users.mjs
```

This creates confirmed users `demo@campusfind.test` and `admin@campusfind.test`. Enter either email plus its chosen password on the web or mobile login screen to avoid consuming an email send. Never put the service-role key in browser or Expo public environment variables.
