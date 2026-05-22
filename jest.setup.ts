import '@testing-library/jest-dom'

// Prevent SDK initialization errors in tests when modules load at module-level
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.RESEND_API_KEY = 're_test_dummy'
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.backyard-sauna.com'
