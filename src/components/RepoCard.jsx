import { GITHUB_HOSTS, safeUrl } from "../lib/github";
import { card, link, muted } from "./ui";
const tag = "rounded-full border border-slate-300 px-2 text-xs font-normal dark:border-slate-600";

export default function RepoCard({ repo, t, fmt }) {
  const url = safeUrl(repo.html_url, GITHUB_HOSTS);
  const license = repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? repo.license.spdx_id : null;

  return (
    <li className={`${card} flex flex-col gap-2 p-4`}>
      <h3 className="flex flex-wrap items-center gap-2 font-bold break-words">
        {url ? (
          <a className={link} href={url} target="_blank" rel="noopener noreferrer">
            <bdi dir="ltr">{repo.name}</bdi>
          </a>
        ) : (
          <bdi dir="ltr">{repo.name}</bdi>
        )}
        {repo.fork && <span className={`${tag} ${muted}`}>{t.fork}</span>}
        {repo.archived && <span className={`${tag} ${muted}`}>{t.archived}</span>}
      </h3>

      <p className={`flex-1 break-words ${muted}`}>{repo.description || t.noDesc}</p>

      {repo.topics?.length > 0 && (
        <ul aria-label={t.topics} className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 5).map((tp) => (
            <li key={tp} className="rounded-md bg-slate-100 px-2 text-xs dark:bg-slate-700">
              <bdi dir="ltr">{tp}</bdi>
            </li>
          ))}
        </ul>
      )}

      <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${muted}`}>
        {repo.language && <span><bdi dir="ltr">{repo.language}</bdi></span>}
        <span title={t.starsTitle} className="text-amber-700 dark:text-amber-400">★ {fmt.num(repo.stargazers_count)}</span>
        <span title="Forks">⑂ {fmt.num(repo.forks_count)}</span>
        {license && <span><bdi dir="ltr">{license}</bdi></span>}
        <span>{t.updated} {fmt.date(repo.pushed_at || repo.updated_at)}</span>
      </div>
    </li>
  );
}
