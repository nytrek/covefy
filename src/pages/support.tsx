import Navbar from "@src/components/navbar";
import Footer from "@src/components/footer";

const faqs = [
  {
    id: 1,
    question: "What are credits used for?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    id: 2,
    question: "How do I earn a spot in the top 8?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    id: 3,
    question: "When can I claim my credits?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    id: 4,
    question: "Do I lose 2 credits if I use AI?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    id: 5,
    question: "Likes vs bookmarks?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    id: 6,
    question: "Where can I disable my account?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
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
            Have a different question? Contact us at ktra99@outlook.com
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
        </div>
      </div>
      <Footer />
    </>
  );
}
