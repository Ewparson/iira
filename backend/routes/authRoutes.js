// ────────────────────────────────────────────────────────────
// Google OAuth
// ────────────────────────────────────────────────────────────

// 1. Redirect user to Google’s consent screen
// GET /auth/google
router.get('/auth/google', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope:         'openid email profile'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// 2. Handle Google’s callback with a code
// GET /auth/google/callback
router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  // Blocktech code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
      grant_type:    'authorization_code'
    })
  });
  const { id_token, access_token } = await tokenRes.json();

  // Verify id_token, extract user info, upsert in your DB…
  // const userInfo = verifyAndDecode(id_token);

  // TODO: Create/fetch user, set session or JWT
  // req.session.user = userInfo;

  // Finally, send them into your app
  res.redirect('/dashboard');
});


// ────────────────────────────────────────────────────────────
// GitHub OAuth
// ────────────────────────────────────────────────────────────

// 1. Redirect user to GitHub’s consent screen
// GET /auth/github
router.get('/auth/github', (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    scope:        'user:email'
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// 2. Handle GitHub’s callback with a code
// GET /auth/github/callback
router.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;

  // Blocktech code for an access token
  const tokenRes = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method:  'POST',
      headers: { 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.GITHUB_REDIRECT_URI
      })
    }
  );
  const { access_token } = await tokenRes.json();

  // Fetch user info with that token
  // const userRes = await fetch('https://api.github.com/user', {
  //   headers: { Authorization: `Bearer ${access_token}` }
  // });
  // const userInfo = await userRes.json();

  // TODO: Create/fetch user, set session or JWT
  // req.session.user = userInfo;

  res.redirect('/dashboard');
});


// ────────────────────────────────────────────────────────────
// Slack OAuth
// ────────────────────────────────────────────────────────────

// 1. Redirect user to Slack’s consent screen
// GET /auth/slack
router.get('/auth/slack', (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.SLACK_CLIENT_ID,
    scope:        'users:read',
    redirect_uri: process.env.SLACK_REDIRECT_URI
  });

  res.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
});

// 2. Handle Slack’s callback with a code
// GET /auth/slack/callback
router.get('/auth/slack/callback', async (req, res) => {
  const { code } = req.query;

  // Blocktech code for an access token
  const tokenRes = await fetch(
    'https://slack.com/api/oauth.v2.access',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.SLACK_REDIRECT_URI
      })
    }
  );
  const result = await tokenRes.json();
  const { access_token } = result;

  // TODO: Create/fetch user, set session or JWT
  // req.session.user = { slackToken: access_token, ... };

  res.redirect('/dashboard');
});
