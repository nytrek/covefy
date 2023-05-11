import { SignedIn } from "@clerk/nextjs";
import { TicketIcon } from "@heroicons/react/24/outline";

const faqs = [
  {
    id: 1,
    question: "What are credits used for?",
    answer:
      "Credits can be used to create posts, boards and interact with AI. The use of credits will expand as new features come in.",
  },
  {
    id: 2,
    question: "How do I send posts to friends?",
    answer:
      "You can send posts to your friends by visiting their profile page. You can choose to send it publicly or privately like any other post.",
  },
  {
    id: 3,
    question: "Where can I find my boards?",
    answer:
      "You can find your boards under your account page where you will have access to all your previous boards.",
  },
];

export default function Feedback() {
  return (
    <>
      <SignedIn>
        <div className="mt-8 pb-36">
          <div className="mx-auto max-w-7xl p-6">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Send feedback
            </h2>
            <p className="mt-6 text-xl text-gray-300 sm:text-2xl">
              Any feedback is welcome. Please address your feedback directly to{" "}
              <a href="mailto:kennytran.dev@outlook.com" className="underline">
                kennytran.dev@outlook.com
              </a>
            </p>
            <div className="mt-20">
              <h2 className="text-2xl font-medium text-brand-50">FAQ</h2>
              <dl className="mt-6 space-y-16 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-16 sm:space-y-0 lg:grid-cols-3 lg:gap-x-10">
                {faqs.map((faq) => (
                  <div key={faq.id}>
                    <dt className="text-2xl font-semibold text-white">
                      {faq.question}
                    </dt>
                    <dd className="mt-2 text-base text-gray-300">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <section className="mt-16 rounded-lg">
              <h2 className="text-2xl font-medium text-brand-50">
                Credit usage
              </h2>

              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-t border-brand-200 pt-4">
                  <dt className="text-brand-50">Use AI</dt>
                  <dd className="flex items-center space-x-1 font-medium text-brand-50">
                    <span>1000</span>
                    <TicketIcon className="h-5 w-5" />
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
