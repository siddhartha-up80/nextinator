import Footer from "@/components/main/footer";
import Homenav from "@/components/main/homenav";
import ParticlesComponent from "@/components/main/particles";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* <ParticlesComponent /> */}
      <Homenav />
      <div className="min-h-screen max-w-6xl mx-auto">
        <section className="container flex flex-col justify-center p-6 mx-auto sm:py-12 lg:py-24 lg:flex-row lg:justify-between">
          <div className="flex items-center justify-center p-6 mt-8 lg:mt-0 h-72 sm:h-80 lg:h-96 xl:h-112 2xl:h-128 relative z-40">
            <Image
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
              height={800}
              width={1000}
              alt=""
              className="object-contain h-72 sm:h-80 lg:h-96 xl:h-112 2xl:h-128"
            />
          </div>
          <div className="flex flex-col justify-center p-6 text-center rounded-sm lg:max-w-md xl:max-w-lg lg:text-left">
            <h1 className="text-3xl font-bold leadi sm:text-5xl">
              Chat with AI using your custom data with <span>Next</span>
              <span className="text-rose-600">Inator</span>
            </h1>
            <p className="mt-6 mb-6 text-lg sm:mb-8">
              Just sign up and start adding your data, and the AI will chat with
              you based on your data. It's that simple.
            </p>
            <div className="flex flex-col sm:items-center sm:justify-center sm:flex-row sm:space-y-0 sm:space-x-4 lg:justify-start">
              <Link href="/inator">
                <Button className="">Get Started</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
