const GITHUB_API = 'https://api.github.com';
const REPO = process.env.GITHUB_FEEDBACK_REPO ?? 'austin-rt/who-clinches';

interface IssueParams {
  title: string;
  body: string;
  labels?: string[];
}

// Opens a GitHub issue so feedback lands somewhere trackable and GitHub's own
// notifications do the emailing. No-ops without a token so local and preview
// runs stay quiet.
export const createIssue = async (params: IssueParams): Promise<void> => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return;

  const res = await fetch(`${GITHUB_API}/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'who-clinches',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: params.title,
      body: params.body,
      ...(params.labels?.length ? { labels: params.labels } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub error: ${res.status} ${body}`);
  }
};
