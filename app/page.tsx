import dynamic from "next/dynamic";
import RegisterSW from "@/components/RegisterSW";
import Splash from "@/components/Splash";

const DottorSOS = dynamic(() => import("@/components/DottorSOS"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#0b0b0b] text-white flex flex-col items-center justify-center">
      <img src="/logo.svg" alt="DOTTOR SOS" className="w-28 h-28 rounded-[28px]" />
      <p className="mt-4 font-black text-2xl">DOTTOR SOS</p>
    </div>
  ),
});

export default function Page() {
  return (
    <>
      <RegisterSW />
      <Splash />
      <DottorSOS />
    </>
  );
}
