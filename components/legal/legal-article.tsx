import { LEGAL_OPERATOR } from "@/lib/legal/company";
import type { LegalDocument } from "@/lib/legal/policies";

export function LegalArticle({ document }: { document: LegalDocument }) {
  return (
    <article className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-10 sm:py-16">
      <p className="text-[12px] font-semibold tracking-[0.6px] text-[#006c49]">Legal</p>
      <h1 className="mt-2 text-[36px] font-bold leading-10 tracking-[-0.8px] text-black sm:text-[40px] sm:leading-[48px]">
        {document.title}
      </h1>
      <p className="mt-3 text-[14px] leading-5 text-[#45464d]">Last updated {document.updated}</p>
      <p className="mt-6 text-[16px] leading-7 text-[#0b1c30]">{document.intro}</p>
      {document.sections.map((section) => (
        <section key={section.id} id={section.id} className="mt-10">
          <h2 className="text-[22px] font-semibold leading-8 text-black">{section.title}</h2>
          {section.blocks.map((block, index) => {
            if (block.type === "p") {
              return (
                <p key={index} className="mt-3 text-[16px] leading-7 text-[#0b1c30]">
                  {block.text}
                </p>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={index} className="mt-3 list-disc space-y-2 pl-5 text-[16px] leading-7 text-[#0b1c30]">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <div key={index} className="mt-4 overflow-x-auto rounded-lg border border-[#e2e8f0]">
                <table className="min-w-full text-left text-[13px] leading-5 text-[#0b1c30]">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} className="px-3 py-2 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row[0]} className="border-t border-[#e2e8f0] align-top">
                        {row.map((cell, cellIndex) => (
                          <td key={`${row[0]}-${cellIndex}`} className="px-3 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>
      ))}
      <p className="mt-12 text-[13px] leading-5 text-[#45464d]">
        © {new Date().getFullYear()} {LEGAL_OPERATOR}. This page is informational and does not constitute legal advice.
      </p>
    </article>
  );
}
