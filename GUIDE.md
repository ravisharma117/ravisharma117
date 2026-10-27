# Setting up the GitHub profile

This folder is your **profile repository**. GitHub shows a repo's `README.md` at the top of your profile when the repo is public and has exactly the same name as your username: `ravisharma117/ravisharma117`.

## How it works

| File | What it is | Edit it? |
|---|---|---|
| `README.template.md` | About, skills, experience, contact: the text you write by hand | ✅ Yes |
| `scripts/build-readme.mjs` | Fetches your public projects from `naxits-api.netlify.app` and writes `README.md` | Rarely |
| `README.md` | **Generated.** It is overwritten on every build | ❌ No |
| `.github/workflows/update-readme.yml` | Rebuilds the README every day at 08:00 IST, when you push, and when you run it manually | Rarely |

The projects come from `GET /api/public/projects?site=imravithedev`, the same data that feeds your portfolio. NDA projects and NDA images are already removed there. The build needs no secrets.

## One-time setup

1. **Create the repo.** Go to <https://github.com/new>:
   - Repository name: `ravisharma117`. GitHub shows a *"✨ special repository"* notice.
   - Visibility: **Public**
   - Leave *Add a README* **unticked**, because this folder already has one.
2. **Push this folder.** Run from `D:\Projects\NAX IT Solutions\ravisharma117`:
   ```powershell
   git init -b main
   git add -A
   git commit -m "Profile README"
   git remote add origin https://github.com/ravisharma117/ravisharma117.git
   git push -u origin main
   ```
3. **Let the workflow commit.** In the repo, go to **Settings → Actions → General → Workflow permissions**, choose **Read and write permissions**, and save.
4. **Run it once.** Go to **Actions → Update README → Run workflow**. The run should say "README.md unchanged", because you pushed a freshly built README.
5. **Fill in your profile** at <https://github.com/settings/profile>:
   - **Profile picture:** click your avatar → *Upload a photo…* → choose `avatar.jpg` from this folder (1254×1254, ~290 KB, under GitHub's 1 MB limit).
   - **Name:** Ravi Kant
   - **Bio:** Full-Stack .NET Engineer | Solutions Architect
   - **Location:** Ghumarwin, India
   - **Website:** `https://imravithedev.com`
   - **Social accounts:** LinkedIn and Upwork
6. **Pin repositories.** On your profile page, click **Customize your pins** and choose up to 6 public repos, for example `dreamwashautospa` or `imravithedev-website`. Only public repos can be pinned.
7. **Optional extras:**
   - **Status:** click the smiley under your avatar and set something like "Open to contract work".
   - **Private contributions:** **Settings → Public profile → Contributions & activity** → tick *Include private contributions on my profile*. Most of your work is in private repos, so the contribution graph looks empty without this. Only counts are shown, never repo names or code.
   - **Achievements:** turn on *Show Achievements on my profile* in the same section.

## Day-to-day

- **Add or edit a project:** do it in admin.naxits as usual. The profile updates by the next morning. To update it sooner, go to **Actions → Update README → Run workflow**.
- **Change the about text, skills or experience:** edit `README.template.md` and push. The workflow rebuilds on push.
- **Preview locally:** run `npm run build` (Node 20+), then open `README.md` in VS Code and press `Ctrl+Shift+V`.
- **Hide a project from GitHub but keep it on naxits.com:** in admin, untick *imravithedev* under the project's sites. The profile uses the imravithedev list.
- **Promote a project to the image cards:** mark it **Featured** in admin. Card order follows **Priority**, with 1 shown first.

## Notes

- **Badge logos:** they come from simple-icons through shields.io. Microsoft, AWS and LinkedIn logos were removed from that set at the brands' request, so those badges (Azure, SQL Server, AWS, WinForms, LinkedIn…) are plain coloured badges. That is expected, not a broken image.
- **Image format:** the project cover images use Cloudinary crops with `f_jpg`, so they load through GitHub's image proxy.
