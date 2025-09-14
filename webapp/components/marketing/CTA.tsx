import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">Ready to build with Verbio?</h3>
              <p className="text-indigo-100">Create an account and make your first call in minutes.</p>
            </div>
            <Link href="/signup" className="rounded-lg bg-white px-4 py-2 font-semibold text-indigo-700 hover:bg-gray-100">
              Start free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
