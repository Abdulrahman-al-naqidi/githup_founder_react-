import { AVATAR_HOSTS, GITHUB_HOSTS, safeUrl } from "../lib/github";
import { btnPrimary, card, link, muted } from "./ui";
function Stat({ label, value, fmt }) {
  return (
    <div className="flex flex-col">
      <strong className="text-2xl leading-tight">{fmt.num(value)}</strong>
      <span className={`text-sm ${muted}`}>{label}</span>
    </div>
  );
}

export default function ProfileCard({ user, totalStars, t, fmt }) {
  const avatar = safeUrl(user.avatar_url, AVATAR_HOSTS);
  const profile = safeUrl(user.html_url, GITHUB_HOSTS);
  const blog = safeUrl(user.blog);
  const twitter =
    user.twitter_username && /^[A-Za-z0-9_]{1,15}$/.test(user.twitter_username) ? user.twitter_username : null;

  return (
    <section aria-label={t.profile} className={`${card} mb-8 grid gap-6 p-5 sm:grid-cols-[9rem_1fr] sm:p-6`}>
      {avatar && (
        <img
          src={avatar}
          alt={t.avatarAlt(user.login)}
          width="144"
          height="144"
          referrerPolicy="no-referrer"
          className="size-28 rounded-full border-4 border-slate-200 object-cover sm:size-36 dark:border-slate-700"
        />
      )}

      <div>
        <h2 className="text-2xl font-bold">{user.name || user.login}</h2>
        <p className={`mb-2 ${muted}`}>
          <bdi dir="ltr">@{user.login}</bdi>
        </p>
        {user.bio && <p className="mb-3 max-w-prose">{user.bio}</p>}

        <dl className="mt-3 mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {user.company && (<><dt className={muted}>{t.company}</dt><dd className="break-words">{user.company}</dd></>)}
          {user.location && (<><dt className={muted}>{t.location}</dt><dd className="break-words">{user.location}</dd></>)}
          {user.email && (<><dt className={muted}>{t.email}</dt><dd className="break-all"><bdi dir="ltr">{user.email}</bdi></dd></>)}
          {blog && (
            <>
              <dt className={muted}>{t.site}</dt>
              <dd className="break-all">
                <bdi dir="ltr">
                  <a className={link} href={blog} target="_blank" rel="noopener noreferrer nofollow">
                    {blog.replace(/^https?:\/\//, "")}
                  </a>
                </bdi>
              </dd>
            </>
          )}
          {twitter && (
            <>
              <dt className={muted}>X</dt>
              <dd>
                <bdi dir="ltr">
                  <a className={link} href={`https://x.com/${twitter}`} target="_blank" rel="noopener noreferrer nofollow">
                    @{twitter}
                  </a>
                </bdi>
              </dd>
            </>
          )}
          <dt className={muted}>{t.joined}</dt>
          <dd>{fmt.date(user.created_at)}</dd>
          {user.hireable && (<><dt className={muted}>{t.status}</dt><dd>{t.hireable}</dd></>)}
        </dl>

        {profile && (
          <a className={btnPrimary} href={profile} target="_blank" rel="noopener noreferrer">
            {t.openGH}
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 sm:col-span-2 sm:grid-cols-5 dark:border-slate-700">
        <Stat label={t.repos} value={user.public_repos} fmt={fmt} />
        <Stat label={t.followers} value={user.followers} fmt={fmt} />
        <Stat label={t.following} value={user.following} fmt={fmt} />
        <Stat label={t.gists} value={user.public_gists} fmt={fmt} />
        <Stat label={t.stars} value={totalStars} fmt={fmt} />
      </div>
    </section>
  );
}
