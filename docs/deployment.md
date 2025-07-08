# Deployment Guide – Flight Booking System (Next.js + Supabase on Vercel)

---

## 1. **Prerequisites**

- GitHub account (your code is in a GitHub repo)
- Vercel account ([sign up here](https://vercel.com/signup))
- Supabase project set up (get your keys from the Supabase dashboard)

---

## 2. **Push Your Code to GitHub**

If not already done:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

---

## 3. **Deploy to Vercel**

1. Go to [vercel.com/import](https://vercel.com/import)
2. Click “Import Git Repository”
3. Select your repo (log in with GitHub if prompted)
4. Vercel auto-detects Next.js. Click “Deploy”
5. Wait ~2 minutes for build to finish

---

## 4. **Set Environment Variables**

After the first deploy, go to your new project in the [Vercel dashboard](https://vercel.com/dashboard).

- Go to **Settings > Environment Variables**
- Add these (example names, check your `.env.local`):

| Name                         | Value (from Supabase/Resend/etc.)      |
|------------------------------|----------------------------------------|
| NEXT_PUBLIC_SUPABASE_URL     | `https://xxxx.supabase.co`             |
| NEXT_PUBLIC_SUPABASE_ANON_KEY| `your-anon-key`                        |
| SUPABASE_SERVICE_ROLE_KEY    | `your-service-role-key`                |
| RESEND_API_KEY               | `your-resend-api-key`                  |
| ...                          | ...                                    |

- Click **Save** and **Redeploy**.

---

## 5. **Supabase Auth Callback (Optional for Auth)**

If you use Supabase Auth, set your Vercel domain in your [Supabase Auth settings](https://app.supabase.com/project/_/auth/providers) as an allowed redirect URL.  
Example: `https://your-vercel-project.vercel.app`

---

## 6. **Check Your Live App**

- Visit your deployment URL:  
  `https://your-vercel-project.vercel.app`
- Test login, booking, flight search, etc.

---

## 7. **(Optional) Custom Domain**

- In Vercel dashboard: Settings > Domains > Add Domain

---

## 8. **(Optional) Add Vercel Badge to README**

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=your-repo-link)
```

---

## 9. **Troubleshooting Tips**

- If builds fail, check Vercel logs (Dashboard > Deployments)
- Double-check env variable names and values
- Ensure your Supabase project is live and accessible

---

## 10. **Updating the App**

- Just `git push` to your main branch
- Vercel auto-deploys!

---

> **Done!** You have a modern, scalable, serverless deployment—no Docker, no servers to manage.
