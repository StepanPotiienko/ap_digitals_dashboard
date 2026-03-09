This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Showcasing to clients with ngrok

To share the dashboard via a public URL (e.g. for client demos):

1. **Terminal 1** – start the dev server:
   ```bash
   npm run dev
   ```

2. **Terminal 2** – start ngrok (creates a tunnel to your local port 3000):
   ```bash
   npm run ngrok
   ```
   Or install ngrok and run: `ngrok http 3000`

3. Use the **HTTPS URL** ngrok prints (e.g. `https://abc123.ngrok-free.app`) and share it with your client. The app is configured to accept requests from ngrok origins in development.

**Two different endpoints (e.g. dashboard + Notion webhook server):** On the **free tier**, ngrok allows only **one active tunnel** per account. So you can’t have two ngrok URLs at the same time with one free account. Options:

- **Use one tunnel at a time:** Stop the webhook tunnel when showcasing the dashboard (`npm run ngrok` → port 3000), or stop the dashboard tunnel when you need webhooks (`npm run ngrok:webhook` → port 4000). Edit the port in `ngrok:webhook` in `package.json` if your webhook server runs on another port.
- **Ngrok paid plan:** Allows multiple simultaneous tunnels, so you can run `npm run ngrok` in one terminal and `npm run ngrok:webhook` in another and get two different URLs.
- **Second tunnel with another tool:** Keep ngrok for the webhook (or for the dashboard) and use another tunnel for the other (e.g. [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) or [localtunnel](https://localtunnel.github.io/www/)).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
