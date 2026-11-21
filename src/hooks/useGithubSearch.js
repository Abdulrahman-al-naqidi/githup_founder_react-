import { useEffect, useState } from "react";
import { PER_PAGE, USERNAME_RE, createRequest, extractUsername, ghFetch } from "../lib/github";

function toError(err, timedOut) {
  if (err.name === "AbortError") return timedOut ? { key: "errTimeout" } : null;
  if (err.message === "NOT_FOUND") return { key: "errNotFound" };
  if (err.message === "RATE_LIMIT") return { key: "errRate", reset: err.reset };
  return { key: "errGeneric" };
}

export function useGithubSearch() {
  const [request, setRequest] = useState(null); // { name } -> GET /users/{name}
  const [nameQuery, setNameQuery] = useState(null); // { q, afterMiss } -> GET /search/users
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null); // { key, reset? } translated in the UI

  /* Effect 1: profile + first page of repos whenever a username is submitted */
  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    let chained = false;
    const req = createRequest();
    const enc = encodeURIComponent(request.name);

    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setNotice("");
    setUser(null);
    setRepos([]);
    setPage(1);
    setSuggestions([]);

    (async () => {
      try {
        const [u, r] = await Promise.all([
          ghFetch(`/users/${enc}`, req.signal),
          ghFetch(`/users/${enc}/repos?per_page=${PER_PAGE}&page=1&sort=updated`, req.signal),
        ]);
        if (cancelled) return;
        setUser(u);
        setRepos(Array.isArray(r) ? r : []);
      } catch (err) {
        if (cancelled) return;
        if (err.message === "NOT_FOUND") {
          chained = true; // hand over to effect 2 (suggestions)
          setNameQuery({ q: request.name, afterMiss: true });
        } else {
          setError(toError(err, req.timedOut()));
        }
      } finally {
        req.done();
        if (!cancelled && !chained) setLoading(false);
      }
    })();

    // cleanup: a newer search (or unmount) cancels the in-flight request
    return () => {
      cancelled = true;
      req.cancel();
    };
  }, [request]);

  /* Effect 2: search by display name / typo -> suggestions */
  useEffect(() => {
    if (!nameQuery) return;
    let cancelled = false;
    const req = createRequest();

    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setNotice("");
    setSuggestions([]);
    if (!nameQuery.afterMiss) {
      setUser(null);
      setRepos([]);
      setPage(1);
    }

    (async () => {
      try {
        const data = await ghFetch(
          `/search/users?q=${encodeURIComponent(nameQuery.q)}%20in:login%20in:name&per_page=6`,
          req.signal
        );
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items.filter((i) => USERNAME_RE.test(i.login)) : [];
        if (items.length === 0) {
          setError({ key: "errNotFound" });
        } else {
          setSuggestions(items);
          setNotice(nameQuery.afterMiss ? "didYouMean" : "pickAccount");
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          nameQuery.afterMiss && err.name !== "AbortError" ? { key: "errNotFound" } : toError(err, req.timedOut())
        );
      } finally {
        req.done();
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      req.cancel();
    };
  }, [nameQuery]);

  /* Effect 3: load more repos when `page` increases */
  const login = user?.login;
  useEffect(() => {
    if (page === 1 || !login) return;
    let cancelled = false;
    const req = createRequest();
    setLoadingMore(true);

    (async () => {
      try {
        const r = await ghFetch(
          `/users/${encodeURIComponent(login)}/repos?per_page=${PER_PAGE}&page=${page}&sort=updated`,
          req.signal
        );
        if (cancelled) return;
        setRepos((prev) => [...prev, ...(Array.isArray(r) ? r : [])]);
      } catch (err) {
        if (cancelled) return;
        const e = toError(err, req.timedOut());
        if (e) setError(e);
      } finally {
        req.done();
        if (!cancelled) setLoadingMore(false);
      }
    })();

    return () => {
      cancelled = true;
      req.cancel();
    };
  }, [page, login]);

  function search(rawInput) {
    const name = extractUsername(rawInput.trim().replace(/^@/, "")).slice(0, 60);
    if (!name) return;
    if (USERNAME_RE.test(name)) {
      setNameQuery(null);
      setRequest({ name });
    } else {
      // spaces / invalid characters -> treat it as a person's name and search
      setRequest(null);
      setNameQuery({ q: name, afterMiss: false });
    }
  }

  const loadMore = () => setPage((p) => p + 1);
  const hasMore = Boolean(user) && repos.length < user.public_repos;

  return { user, repos, suggestions, notice, loading, loadingMore, error, hasMore, search, loadMore };
}
