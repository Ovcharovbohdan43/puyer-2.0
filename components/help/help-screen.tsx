"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { t } from "@/lib/i18n";
import { filterHelpArticles, helpArticles, helpCategories, type HelpArticle } from "@/lib/help/articles";
import { HELP_TOPICS, MAX_HELP_MESSAGE, MAX_HELP_NAME } from "@/lib/help/input";

export type HelpTicketRow = {
  id: string;
  topic: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  message: string;
};

type HelpScreenProps = {
  signedIn: boolean;
  email: string;
  name: string;
  tickets: HelpTicketRow[];
};

export function HelpScreen({ signedIn, email, name, tickets }: HelpScreenProps) {
  const copy = t("help");
  const articles = useMemo(() => helpArticles(), []);
  const categories = useMemo(() => helpCategories(articles), [articles]);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [formName, setFormName] = useState(name);
  const [formEmail, setFormEmail] = useState(email);
  const [topic, setTopic] = useState<(typeof HELP_TOPICS)[number]>("INVOICES");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ id: string; email: string; topic: (typeof HELP_TOPICS)[number] } | null>(
    null,
  );

  const visible = useMemo(() => {
    const searched = filterHelpArticles(articles, query);
    if (!category) {
      return searched;
    }
    return searched.filter((article) => article.category === category);
  }, [articles, category, query]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          topic,
          message,
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string; id?: string };
      if (!response.ok) {
        setError(body.error || copy.sendFailed);
        return;
      }
      setSent({
        id: body.id || "",
        email: formEmail,
        topic,
      });
      setMessage("");
      router.refresh();
    } catch {
      setError(copy.sendFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#F6F7F6] px-5 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div>
          <h1 className="text-[32px] leading-10 font-semibold text-[#111827]">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-5 text-[#6B7280]">{copy.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <section className="flex min-w-0 flex-col gap-4">
            <label className="flex flex-col gap-1 text-[12px] text-[#6B7280]">
              {copy.searchLabel}
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-[42px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  category === null ? "bg-[#006C49] text-white" : "border border-[#E5E7EB] bg-white text-[#111827]"
                }`}
                onClick={() => setCategory(null)}
              >
                {copy.allCategories}
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    category === item ? "bg-[#006C49] text-white" : "border border-[#E5E7EB] bg-white text-[#111827]"
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {visible.length === 0 ? (
                <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-[14px] text-[#6B7280]">{copy.noArticles}</p>
              ) : (
                visible.map((article) => <HelpArticleCard key={article.id} article={article} />)
              )}
            </div>
          </section>

          <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <article className="rounded-xl border border-[#E5E7EB] bg-white p-[17px]">
              <h2 className="text-[16px] leading-6 font-semibold text-[#111827]">{copy.contactTitle}</h2>
              <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">{copy.contactBody}</p>
              {sent ? (
                <div className="mt-4 flex flex-col gap-3">
                  <h3 className="text-[16px] leading-6 font-semibold text-[#111827]">{copy.sentTitle}</h3>
                  <p className="text-[14px] leading-5 text-[#374151]">
                    {copy.sentLead.replace("{email}", sent.email)}
                  </p>
                  {sent.id ? (
                    <p className="text-[13px] leading-5 text-[#111827]">
                      <span className="text-[#6B7280]">{copy.sentRef}: </span>
                      <span className="font-mono break-all">{sent.id}</span>
                    </p>
                  ) : null}
                  <p className="text-[13px] leading-5 text-[#111827]">
                    <span className="text-[#6B7280]">{copy.sentTopic}: </span>
                    {copy.topics[sent.topic]}
                  </p>
                  <p className="text-[14px] leading-5 text-[#6B7280]">{copy.sentNext}</p>
                  {signedIn ? <p className="text-[14px] leading-5 text-[#6B7280]">{copy.sentTicketsHint}</p> : null}
                  <button
                    type="button"
                    className="mt-1 self-start rounded-lg border border-[#E5E7EB] px-4 py-2 text-[12px] font-semibold text-[#111827]"
                    onClick={() => setSent(null)}
                  >
                    {copy.sentAgain}
                  </button>
                </div>
              ) : (
                <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
                  <label className="flex flex-col gap-1 text-[12px] text-[#6B7280]">
                    {copy.name}
                    <input
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      required
                      maxLength={MAX_HELP_NAME}
                      className="h-[38px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] text-[#6B7280]">
                    {copy.email}
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(event) => setFormEmail(event.target.value)}
                      required
                      readOnly={signedIn}
                      className="h-[38px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none read-only:bg-[#F9FAFB]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] text-[#6B7280]">
                    {copy.topic}
                    <select
                      value={topic}
                      onChange={(event) => setTopic(event.target.value as (typeof HELP_TOPICS)[number])}
                      className="h-[38px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none"
                    >
                      {HELP_TOPICS.map((item) => (
                        <option key={item} value={item}>
                          {copy.topics[item]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] text-[#6B7280]">
                    {copy.message}
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      required
                      minLength={10}
                      maxLength={MAX_HELP_MESSAGE}
                      rows={6}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#111827] outline-none"
                    />
                  </label>
                  {error ? <p className="text-[14px] text-[#ef4444]">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-[#006C49] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
                  >
                    {pending ? copy.sending : copy.submit}
                  </button>
                </form>
              )}
            </article>

            {signedIn ? (
              <article className="rounded-xl border border-[#E5E7EB] bg-white p-[17px]">
                <h2 className="text-[16px] leading-6 font-semibold text-[#111827]">{copy.ticketsTitle}</h2>
                {tickets.length === 0 ? (
                  <p className="mt-2 text-[14px] text-[#6B7280]">{copy.ticketsEmpty}</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {tickets.map((ticket) => (
                      <li key={ticket.id} className="border-t border-[#E5E7EB] pt-3 first:border-t-0 first:pt-0">
                        <p className="text-[12px] font-semibold text-[#111827]">
                          {copy.topics[ticket.topic as keyof typeof copy.topics] ?? ticket.topic}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B7280]">
                          {ticket.status === "CLOSED" ? copy.statusClosed : copy.statusOpen}
                          {" · "}
                          {new Date(ticket.createdAt).toLocaleDateString("en-US")}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[13px] text-[#374151]">{ticket.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function HelpArticleCard({ article }: { article: HelpArticle }) {
  return (
    <details className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#111827]">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.4px] text-[#006C49] uppercase">
          {article.category}
        </span>
        {article.title}
      </summary>
      <p className="mt-3 text-[14px] leading-5 text-[#6B7280]">{article.body}</p>
    </details>
  );
}
