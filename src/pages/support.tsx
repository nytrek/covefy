import Footer from "@src/components/footer";
import Navbar from "@src/components/navbar";
import { TicketIcon } from "@heroicons/react/24/outline";

const faqs = [
  {
    id: 1,
    question: "What are credits used for?",
    answer:
      "Credits can be used to create notes, interact with AI and purchase banners in the marketplace. The use of credits will expand as new features come in.",
  },
  {
    id: 2,
    question: "How do I earn a spot in the top 8?",
    answer:
      "The top 8 consists of the top most engaging notes. To earn a spot in the top 8, create valueable notes for the community.",
  },
  {
    id: 3,
    question: "When can I claim my credits?",
    answer:
      "You can claim your credits at the end of each month if you've subscribed to a plan or won a spot in the top 8.",
  },
  // More questions...
];

export default function Support() {
  return (
    <>
      <Navbar />
      <div className="mt-12 pb-36">
        <div className="mx-auto max-w-7xl px-6 sm:py-24 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xl text-gray-300 sm:text-2xl">
            Have a different question? Contact us at kennytran.dev@outlook.com
          </p>
          <div className="mt-20">
            <dl className="space-y-16 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-16 sm:space-y-0 lg:grid-cols-3 lg:gap-x-10">
              {faqs.map((faq) => (
                <div key={faq.id}>
                  <dt className="text-2xl font-semibold text-white">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-base text-gray-300">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
          <section className="mt-16 rounded-lg">
            <h2 className="text-2xl font-medium text-brand-50">Credit usage</h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-brand-50">Use AI</dt>
                <dd className="flex items-center space-x-1 font-medium text-brand-50">
                  <span>5</span>
                  <TicketIcon className="h-5 w-5" />
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-brand-200 pt-4">
                <dt className="text-brand-50">Create note</dt>
                <dd className="flex items-center space-x-1 font-medium text-brand-50">
                  <span>1</span>
                  <TicketIcon className="h-5 w-5" />
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-brand-200 pt-4">
                <dt className="text-brand-50">Comment</dt>
                <dd className="flex items-center space-x-1 font-medium text-brand-50">
                  <span>1</span>
                  <TicketIcon className="h-5 w-5" />
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
