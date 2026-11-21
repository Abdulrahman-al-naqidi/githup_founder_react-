import { useEffect, useMemo, useState } from "react";
import { LOCALES, T } from "./i18n";
import { AVATAR_HOSTS, readPref, safeUrl, savePref } from "./lib/github";
import { useGithubSearch } from "./hooks/useGithubSearch";
import ProfileCard from "./components/ProfileCard";
import RepoCard from "./components/RepoCard";
import { btnGhost, btnPrimary, field, muted } from "./components/ui";
export default function App() {
  /* Preferences: theme + language (remembered in the browser) */
  const [theme, setTheme] = useState(
    () =>
      readPref("gf-theme", ["light", "dark"]) ||
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
  const [uiLang, setUiLang] = useState(() => readPref("gf-lang", ["ar", "en"]) || "ar");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    savePref("gf-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = uiLang === "ar" ? "rtl" : "ltr";
    savePref("gf-lang", uiLang);
  }, [uiLang]);

  const t = T[uiLang];
  const locale = LOCALES[uiLang];
  const fmt = useMemo(
    () => ({
      num: (n) => Number(n || 0).toLocaleString(locale),
      date: (iso) =>
        iso ? new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }) : "—",
      time: (d) => d.toLocaleTimeString(locale),
    }),
    [locale]
  );

  /* Data (fetched with useEffect inside the hook) */
  const { user, repos, suggestions, notice, loading, loadingMore, error, hasMore, search, loadMore } =
    useGithubSearch();

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [sort, setSort] = useState("updated");

  // reset the repo filters whenever a different account is shown
  const login = user?.login;
  useEffect(() => {
    setQuery("");
    setLangFilter("all");
    setSort("updated");
  }, [login]);

  const languages = useMemo(() => [...new Set(repos.map((r) => r.language).filter(Boolean))].sort(), [repos]);
  const totalStars = useMemo(() => repos.reduce((s, r) => s + (r.stargazers_count || 0), 0), [repos]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = repos.filter(
      (r) =>
        (langFilter === "all" || r.language === langFilter) &&
        (!q || r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q))
    );
    const sorters = {
      updated: (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at),
      stars: (a, b) => b.stargazers_count - a.stargazers_count,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(sorters[sort]);
  }, [repos, query, langFilter, sort]);

  const errorText = error
    ? t[error.key] + (error.key === "errRate" && error.reset ? ` ${t.errRateAt(fmt.time(error.reset))}` : "")
    : "";

  function handleSubmit(e) {
    e.preventDefault();
    search(input);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-14">
      {/* Top bar: theme + language */}
      <div className="flex gap-2 pt-4 sm:justify-end">
        <button
          type="button"
          className={`${btnGhost} max-sm:flex-1 max-sm:justify-center`}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? `☀ ${t.themeLight}` : `☾ ${t.themeDark}`}
        </button>
        <button
          type="button"
          className={`${btnGhost} max-sm:flex-1 max-sm:justify-center`}
          onClick={() => setUiLang(uiLang === "ar" ? "en" : "ar")}
          lang={uiLang === "ar" ? "en" : "ar"}
        >
          {t.switchLang}
        </button>
      </div>

      <header className="pt-9 pb-7 sm:pt-14">
        <h1 className="text-3xl leading-tight font-bold sm:text-5xl">{t.title}</h1>
        <p className={`mt-2 mb-6 ${muted}`}>{t.subtitle}</p>

        <form onSubmit={handleSubmit} role="search" className="flex max-w-xl flex-col gap-2 sm:flex-row">
          <label htmlFor="username" className="sr-only">{t.title}</label>
          <input
            id="username"
            type="text"
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={80}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "form-error" : "form-hint"}
            className={`${field} min-w-0 flex-1`}
          />
          <button type="submit" disabled={loading || !input.trim()} className={btnPrimary}>
            {loading ? t.searching : t.search}
          </button>
        </form>

        {error ? (
          <p id="form-error" role="alert" className="mt-3.5 max-w-xl rounded-md border-s-4 border-rose-600 bg-white px-3.5 py-2.5 dark:bg-slate-800">
            {errorText}
          </p>
        ) : (
          <p id="form-hint" className={`mt-3 max-w-prose text-sm ${muted}`}>{t.hint}</p>
        )}
      </header>

      <main>
        {loading && <p role="status" className={`py-5 ${muted}`}>{t.loading}</p>}

        {suggestions.length > 0 && (
          <section aria-label={t.suggestionsTitle} className="mb-7">
            <p className={`py-2 ${muted}`}>{t[notice]}</p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const av = safeUrl(s.avatar_url, AVATAR_HOSTS);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setInput(s.login);
                        search(s.login);
                      }}
                    >
                      {av && <img src={av} alt="" width="28" height="28" referrerPolicy="no-referrer" className="size-7 rounded-full" />}
                      <bdi dir="ltr">{s.login}</bdi>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {user && (
          <>
            <ProfileCard user={user} totalStars={totalStars} t={t} fmt={fmt} />

            <section aria-label={t.repos}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3.5">
                <h2 className="text-xl font-bold">{t.reposHeading(fmt.num(visible.length), fmt.num(user.public_repos))}</h2>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <input
                    type="search"
                    placeholder={t.searchRepos}
                    aria-label={t.searchRepos}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxLength={60}
                    className={`${field} max-sm:flex-1 max-sm:basis-full`}
                  />
                  <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} aria-label={t.language} className={`${field} max-sm:flex-1 max-sm:basis-full`}>
                    <option value="all">{t.allLangs}</option>
                    {languages.map((l) => (<option key={l} value={l}>{l}</option>))}
                  </select>
                  <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t.sortLabel} className={`${field} max-sm:flex-1 max-sm:basis-full`}>
                    <option value="updated">{t.sortUpdated}</option>
                    <option value="stars">{t.sortStars}</option>
                    <option value="name">{t.sortName}</option>
                  </select>
                </div>
              </div>

              {visible.length === 0 ? (
                <p className={`py-5 ${muted}`}>{repos.length === 0 ? t.noPublicRepos : t.noRepoMatch}</p>
              ) : (
                <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((repo) => (<RepoCard key={repo.id} repo={repo} t={t} fmt={fmt} />))}
                </ul>
              )}

              {hasMore && (
                <div className="mt-6 text-center">
                  <button type="button" onClick={loadMore} disabled={loadingMore} className={btnPrimary}>
                    {loadingMore ? t.loadingMore : t.loadMore}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
